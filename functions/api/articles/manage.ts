
function json(data: any, status = 200) {
  return Response.json(data, { status });
}

async function hashCode(code: string) {
  const data = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();

    const articleId = Number(body.article_id);
    const code = String(body.ownership_code || "").trim();
    const action = String(body.action || "").trim();

    if (
      !Number.isInteger(articleId) ||
      articleId < 1 ||
      !/^[A-Fa-f0-9]{32}$/.test(code) ||
      !["update", "delete"].includes(action)
    ) {
      return json({
        success: false,
        message: "Data permintaan tidak valid."
      }, 400);
    }

    const ownership = await context.env.DB.prepare(
      `SELECT ownership_code_hash
       FROM article_ownership
       WHERE article_id = ?`
    ).bind(articleId).first();

    if (!ownership) {
      return json({
        success: false,
        message: "Kode kepemilikan tidak cocok atau berita tidak ditemukan."
      }, 403);
    }

    const submittedHash = await hashCode(code);

    if (submittedHash !== ownership.ownership_code_hash) {
      return json({
        success: false,
        message: "Kode kepemilikan salah."
      }, 403);
    }

    if (action === "delete") {
      await context.env.DB.batch([
        context.env.DB.prepare(
          "DELETE FROM article_ownership WHERE article_id = ?"
        ).bind(articleId),

        context.env.DB.prepare(
          "DELETE FROM articles WHERE id = ?"
        ).bind(articleId)
      ]);

      return json({
        success: true,
        message: "Berita berhasil dihapus."
      });
    }

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
        message: "Data berita tidak valid."
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
      throw new Error("Gagal memperbarui berita.");
    }

    return json({
      success: true,
      message: "Berita berhasil diperbarui."
    });

  } catch (error) {
    return json({
      success: false,
      message: "Terjadi kesalahan saat mengelola berita."
    }, 500);
  }
}
