
function json(data, status = 200) {
  return Response.json(data, { status });
}

async function hashCode(code) {
  const encoded = new TextEncoder().encode(code);
  const hash = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

function makeSlug(title) {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);

  return base || "berita";
}

function makeOwnershipCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));

  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const summary = String(body.summary || "").trim();
    const authorName = String(body.author_name || "").trim();
    const whatsapp = String(body.author_whatsapp || "").trim();
    const imageUrl = String(body.image_url || "").trim();
    const categoryId = Number(body.category_id);

    if (
      title.length < 10 ||
      title.length > 200 ||
      content.length < 50 ||
      content.length > 50000 ||
      authorName.length < 2 ||
      authorName.length > 100 ||
      !/^\+?[0-9]{9,16}$/.test(whatsapp) ||
      !Number.isInteger(categoryId) ||
      categoryId < 1
    ) {
      return json({
        success: false,
        message: "Data berita tidak valid. Periksa judul, isi, penulis, WhatsApp, dan kategori."
      }, 400);
    }

    if (imageUrl) {
      let parsedUrl;

      try {
        parsedUrl = new URL(imageUrl);
      } catch {
        return json({
          success: false,
          message: "Alamat gambar tidak valid."
        }, 400);
      }

      if (parsedUrl.protocol !== "https:") {
        return json({
          success: false,
          message: "URL gambar harus menggunakan HTTPS."
        }, 400);
      }
    }

    const category = await context.env.DB.prepare(
      "SELECT id FROM categories WHERE id = ? AND is_active = 1"
    ).bind(categoryId).first();

    if (!category) {
      return json({
        success: false,
        message: "Kategori tidak ditemukan atau tidak aktif."
      }, 400);
    }

    let slug = makeSlug(title);
    let suffix = crypto.randomUUID().slice(0, 8);

    const existing = await context.env.DB.prepare(
      "SELECT id FROM articles WHERE slug = ?"
    ).bind(slug).first();

    if (existing) {
      slug = `${slug}-${suffix}`;
    }

    const ownershipCode = makeOwnershipCode();
    const ownershipHash = await hashCode(ownershipCode);

    const result = await context.env.DB.prepare(
      `INSERT INTO articles
       (title, slug, content, summary, category_id,
        author_name, author_whatsapp, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).bind(
      title,
      slug,
      content,
      summary || content.slice(0, 180),
      categoryId,
      authorName,
      whatsapp,
      imageUrl || null
    ).run();

    const articleId = result.meta.last_row_id;

    await context.env.DB.prepare(
      `INSERT INTO article_ownership
       (article_id, ownership_code_hash)
       VALUES (?, ?)`
    ).bind(articleId, ownershipHash).run();

    return json({
      success: true,
      message: "Berita berhasil dikirim dan menunggu moderasi.",
      article: {
        id: articleId,
        title,
        slug,
        status: "pending"
      },
      ownership_code: ownershipCode,
      warning: "Simpan kode kepemilikan ini. Kode hanya ditampilkan satu kali."
    }, 201);

  } catch (error) {
    return json({
      success: false,
      message: "Terjadi kesalahan saat menyimpan berita."
    }, 500);
  }
}
