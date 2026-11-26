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

export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json() as Record<string, unknown>;
    const action = String(body.action || "").trim();
    const ownershipCode = String(body.ownership_code || "").trim().toUpperCase();

    if (!/^[A-F0-9]{32}$/.test(ownershipCode)) {
      return json({
        success: false,
        message: "Kode kepemilikan tidak valid."
      }, 400);
    }

    const ownershipHash = await hashCode(ownershipCode);

    // Verifikasi kode dilakukan sepenuhnya di server.
    const ownership = await context.env.DB.prepare(
      `SELECT a.id
       FROM article_ownership ao
       INNER JOIN articles a ON a.id = ao.article_id
       WHERE ao.ownership_code_hash = ?
       LIMIT 1`
    ).bind(ownershipHash).first<{ id: number }>();

    if (!ownership) {
      return json({
        success: false,
        message: "Kode kepemilikan salah atau berita tidak ditemukan."
      }, 403);
    }

    const articleId = ownership.id;

    if (action === "verify") {
      const article = await context.env.DB.prepare(
        `SELECT
           a.id,
           a.slug,
           a.title,
           a.content,
           a.summary,
           a.category_id,
           c.name AS category_name,
           a.author_name,
           a.author_whatsapp,
           a.image_url,
           a.status,
           a.views,
           a.created_at
         FROM articles a
         LEFT JOIN categories c ON c.id = a.category_id
         WHERE a.id = ?`
      ).bind(articleId).first();

      if (!article) {
        return json({
          success: false,
          message: "Berita tidak ditemukan."
        }, 404);
      }

      return json({
        success: true,
        message: "Kode kepemilikan berhasil diverifikasi.",
        article
      });
    }

    if (action === "delete") {
      const results = await context.env.DB.batch([
        context.env.DB.prepare(
          "DELETE FROM article_ownership WHERE article_id = ?"
        ).bind(articleId),
        context.env.DB.prepare(
          "DELETE FROM articles WHERE id = ?"
        ).bind(articleId)
      ]);

      if (!results[0].success || !results[1].success || results[1].meta.changes !== 1) {
        throw new Error("Penghapusan berita gagal.");
      }

      return json({
        success: true,
        message: "Berita berhasil dihapus."
      });
    }

    if (action === "update") {
      const title = String(body.title || "").trim();
      const content = String(body.content || "").trim();
      const summary = String(body.summary || "").trim();
      const categoryId = Number(body.category_id);

      if (
        title.length < 10 ||
        title.length > 200 ||
        content.length < 50 ||
        content.length > 50000 ||
        summary.length > 500 ||
        !Number.isInteger(categoryId) ||
        categoryId < 1
      ) {
        return json({
          success: false,
          message: "Data berita tidak valid. Periksa judul, ringkasan, isi, dan kategori."
        }, 400);
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

      const result = await context.env.DB.prepare(
        `UPDATE articles
         SET title = ?,
             content = ?,
             summary = ?,
             category_id = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).bind(
        title,
        content,
        summary || content.slice(0, 180),
        categoryId,
        articleId
      ).run();

      if (!result.success || result.meta.changes !== 1) {
        throw new Error("Pembaruan berita gagal.");
      }

      return json({
        success: true,
        message: "Berita berhasil diperbarui."
      });
    }

    return json({
      success: false,
      message: "Aksi pengelolaan tidak dikenal."
    }, 400);
  } catch (error) {
    return json({
      success: false,
      message: "Terjadi kesalahan saat mengelola berita."
    }, 500);
  }
}
