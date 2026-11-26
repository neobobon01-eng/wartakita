function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

async function hashCode(code: string) {
  const data = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const action = String(body.action || '').trim();
    const ownershipCode = String(body.ownership_code || '').trim().toUpperCase();

    if (!/^[A-F0-9]{32}$/.test(ownershipCode)) {
      return json({ success: false, message: 'Kode kepemilikan tidak valid.' }, 400);
    }

    const ownershipHash = await hashCode(ownershipCode);
    const db = context.env.DB;

    if (action === 'verify') {
      const article = await db.prepare(
        `SELECT
          a.id, a.title, a.slug, a.content, a.summary, a.category_id,
          a.author_name, a.image_url, a.status, a.views, a.created_at,
          c.name AS category_name
        FROM article_ownership o
        INNER JOIN articles a ON a.id = o.article_id
        LEFT JOIN categories c ON c.id = a.category_id
        WHERE o.ownership_code_hash = ? AND a.status = 'published'
        LIMIT 1`
      ).bind(ownershipHash).first();

      if (!article) {
        return json({ success: false, message: 'Kode tidak cocok atau berita sudah tidak tersedia.' }, 404);
      }

      return json({ success: true, message: 'Kode kepemilikan valid.', article });
    }

    const articleId = Number(body.article_id);
    if (!Number.isInteger(articleId) || articleId < 1) {
      return json({ success: false, message: 'ID berita tidak valid.' }, 400);
    }

    if (action === 'update') {
      const title = String(body.title || '').trim();
      const content = String(body.content || '').trim();
      const summary = String(body.summary || '').trim();
      const categoryId = Number(body.category_id);

      if (
        title.length < 10 || title.length > 200 ||
        content.length < 50 || content.length > 50000 ||
        summary.length > 500 ||
        !Number.isInteger(categoryId) || categoryId < 1
      ) {
        return json({ success: false, message: 'Judul, isi, ringkasan, atau kategori berita tidak valid.' }, 400);
      }

      const category = await db.prepare(
        'SELECT id FROM categories WHERE id = ? AND is_active = 1'
      ).bind(categoryId).first();

      if (!category) {
        return json({ success: false, message: 'Kategori tidak ditemukan atau tidak aktif.' }, 400);
      }

      const result = await db.prepare(
        `UPDATE articles
         SET title = ?, content = ?, summary = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND status = 'published'
           AND EXISTS (
             SELECT 1 FROM article_ownership
             WHERE article_ownership.article_id = articles.id
               AND article_ownership.ownership_code_hash = ?
           )`
      ).bind(title, content, summary || content.slice(0, 180), categoryId, articleId, ownershipHash).run();

      if (!result.success || result.meta.changes !== 1) {
        return json({ success: false, message: 'Berita tidak ditemukan atau kode kepemilikan tidak cocok.' }, 404);
      }

      return json({ success: true, message: 'Berita berhasil diperbarui.' });
    }

    if (action === 'delete') {
      const result = await db.prepare(
        `UPDATE articles
         SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND status = 'published'
           AND EXISTS (
             SELECT 1 FROM article_ownership
             WHERE article_ownership.article_id = articles.id
               AND article_ownership.ownership_code_hash = ?
           )`
      ).bind(articleId, ownershipHash).run();

      if (!result.success || result.meta.changes !== 1) {
        return json({ success: false, message: 'Berita tidak ditemukan atau kode kepemilikan tidak cocok.' }, 404);
      }

      return json({ success: true, message: 'Berita berhasil dihapus dari publik.' });
    }

    return json({ success: false, message: 'Aksi tidak dikenal.' }, 400);
  } catch (error) {
    return json({ success: false, message: 'Terjadi kesalahan saat mengelola berita.' }, 500);
  }
}
