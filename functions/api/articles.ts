import { checkPublicRateLimit } from "./_utils/rate-limit";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function makeSlug(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
  return `${base || "berita"}-${crypto.randomUUID().slice(0, 8)}`;
}

function makeOwnershipCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export async function onRequestPost(context: any) {
  try {
    const ipAddress = context.request.headers.get("CF-Connecting-IP");
    if (!ipAddress) {
      return json({ success: false, message: "Permintaan tidak dapat diverifikasi." }, 503);
    }

    const rateLimit = await checkPublicRateLimit(
      context.env.DB,
      ipAddress,
      "article-create",
      3,
      60 * 60,
      60 * 60
    );

    if (!rateLimit.allowed) {
      return Response.json(
        { success: false, message: "Batas pengiriman berita tercapai. Silakan coba lagi nanti." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const body = await context.request.json();
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const summary = String(body.summary || "").trim();
    const authorName = String(body.author_name || "").trim();
    const whatsapp = String(body.author_whatsapp || "").trim();
    const imageUrl = String(body.image_url || "").trim();
    const categoryId = Number(body.category_id);

    if (
      title.length < 10 || title.length > 200 ||
      content.length < 50 || content.length > 50000 ||
      summary.length > 500 ||
      authorName.length < 2 || authorName.length > 100 ||
      !/^\+?[0-9]{9,16}$/.test(whatsapp) ||
      !Number.isInteger(categoryId) || categoryId < 1
    ) {
      return json({ success: false, message: "Data berita tidak valid. Periksa kembali semua isian." }, 400);
    }

    // Foto unggahan dikompres di browser menjadi JPEG dan disimpan sebagai data URL.
    // Batas 460.000 karakter menjaga ukuran row tetap aman di bawah batas D1 2 MB.
    if (imageUrl.length > 460000) {
      return json({ success: false, message: "Ukuran foto masih terlalu besar. Pilih foto lain." }, 413);
    }
    if (imageUrl) {
      const isInlineJpeg = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(imageUrl);
      if (!isInlineJpeg) {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(imageUrl);
        } catch {
          return json({ success: false, message: "Format foto tidak valid." }, 400);
        }
        if (parsedUrl.protocol !== "https:") {
          return json({ success: false, message: "URL gambar harus menggunakan HTTPS." }, 400);
        }
      }
    }

    const category = await context.env.DB.prepare(
      "SELECT id FROM categories WHERE id = ? AND is_active = 1"
    ).bind(categoryId).first();
    if (!category) {
      return json({ success: false, message: "Kategori tidak ditemukan atau tidak aktif." }, 400);
    }

    const slug = makeSlug(title);
    const ownershipCode = makeOwnershipCode();
    const ownershipHash = await hashCode(ownershipCode);

    const insertArticle = context.env.DB.prepare(
      `INSERT INTO articles (
        title, slug, content, summary, category_id, author_name,
        author_whatsapp, image_url, status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)`
    ).bind(
      title, slug, content, summary || content.slice(0, 180),
      categoryId, authorName, whatsapp, imageUrl || null
    );

    const insertOwnership = context.env.DB.prepare(
      `INSERT INTO article_ownership (article_id, ownership_code_hash)
       SELECT id, ? FROM articles WHERE slug = ?`
    ).bind(ownershipHash, slug);

    const results = await context.env.DB.batch([insertArticle, insertOwnership]);
    if (!results[0].success || !results[1].success || results[1].meta.changes !== 1) {
      throw new Error("Penyimpanan artikel atau kepemilikan gagal.");
    }

    const articleId = results[0].meta.last_row_id;
    return json({
      success: true,
      message: "Berita berhasil diterbitkan dan dapat dibaca publik.",
      article: { id: articleId, title, slug, status: "published", image_url: imageUrl || null },
      ownership_code: ownershipCode,
      warning: "Simpan kode kepemilikan ini. Kode hanya ditampilkan satu kali."
    }, 201);
  } catch (error) {
    console.error("ARTICLES CREATE ERROR:", error);
    return json({ success: false, message: "Terjadi kesalahan saat menyimpan berita." }, 500);
  }
}
