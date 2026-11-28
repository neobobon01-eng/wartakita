import { isSameOriginRequest } from '../_utils/origin';

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );

  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyAdmin(context: any) {
  const cookie = context.request.headers.get('Cookie') || '';
  const token = cookie
    .split(';')
    .map((item: string) => item.trim())
    .find((item: string) => item.startsWith('wk_admin_session='))
    ?.slice('wk_admin_session='.length);

  if (!token) return null;

  const tokenHash = await sha256(token);
  return await context.env.DB.prepare(`
    SELECT a.id, a.username
    FROM admin_sessions s
    INNER JOIN admins a ON a.id = s.admin_id
    WHERE s.session_token_hash = ?
      AND s.expires_at > CURRENT_TIMESTAMP
      AND a.is_active = 1
    LIMIT 1
  `).bind(tokenHash).first<any>();
}

export async function onRequestGet(context: any) {
  try {
    const admin = await verifyAdmin(context);
    if (!admin) {
      return json({
        success: false,
        message: 'Sesi admin tidak ditemukan atau sudah berakhir.',
      }, 401);
    }

    const result = await context.env.DB.prepare(`
      SELECT
        a.id,
        a.title,
        a.slug,
        a.content,
        a.summary,
        a.category_id,
        c.name AS category_name,
        a.author_name,
        a.author_whatsapp,
        a.image_url,
        a.status,
        a.views,
        a.created_at,
        a.updated_at,
        (
          SELECT COUNT(*)
          FROM article_reports r
          WHERE r.article_id = a.id
            AND r.status = 'pending'
        ) AS report_count,
        (
          SELECT r.reason
          FROM article_reports r
          WHERE r.article_id = a.id
            AND r.status = 'pending'
          ORDER BY r.created_at DESC
          LIMIT 1
        ) AS report_reason
      FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      ORDER BY a.created_at DESC
    `).all();

    return json({
      success: true,
      username: admin.username,
      total: result.results.length,
      articles: result.results,
    });
  } catch (error) {
    console.error('ADMIN ARTICLES GET ERROR:', error);
    return json({
      success: false,
      message: 'Gagal mengambil data berita admin.',
    }, 500);
  }
}

export async function onRequestPost(context: any) {
  if (!isSameOriginRequest(context.request)) {
    return json({ success: false, message: 'Asal permintaan tidak diizinkan.' }, 403);
  }

  try {
    const admin = await verifyAdmin(context);
    if (!admin) {
      return json({
        success: false,
        message: 'Sesi admin tidak ditemukan atau sudah berakhir. Silakan login kembali.',
      }, 401);
    }

    let body: any;
    try {
      body = await context.request.json();
    } catch {
      return json({ success: false, message: 'Data permintaan tidak valid.' }, 400);
    }

    const articleId = Number(body.article_id);
    const categoryId = Number(body.category_id);
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const hasNewImage = Object.prototype.hasOwnProperty.call(body, 'image_url');
    const imageUrl = hasNewImage && typeof body.image_url === 'string'
      ? body.image_url
      : '';

    if (!Number.isSafeInteger(articleId) || articleId < 1) {
      return json({ success: false, message: 'ID berita tidak valid.' }, 400);
    }
    if (!title || title.length > 200) {
      return json({ success: false, message: 'Judul wajib diisi dan maksimal 200 karakter.' }, 400);
    }
    if (!content) {
      return json({ success: false, message: 'Isi berita wajib diisi.' }, 400);
    }
    if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
      return json({ success: false, message: 'Kategori berita tidak valid.' }, 400);
    }

    if (hasNewImage) {
      const validImage = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(imageUrl);
      if (!validImage) {
        return json({ success: false, message: 'Format foto tidak valid. Gunakan JPG, PNG, atau WebP.' }, 400);
      }
      if (imageUrl.length > 1400000) {
        return json({ success: false, message: 'Ukuran foto terlalu besar setelah diproses. Pilih foto yang lebih kecil.' }, 413);
      }
    }

    const category = await context.env.DB.prepare(`
      SELECT id, name FROM categories WHERE id = ? LIMIT 1
    `).bind(categoryId).first<any>();

    if (!category) {
      return json({ success: false, message: 'Kategori berita tidak ditemukan.' }, 404);
    }

    const existing = await context.env.DB.prepare(`
      SELECT id, image_url FROM articles WHERE id = ? LIMIT 1
    `).bind(articleId).first<any>();

    if (!existing) {
      return json({ success: false, message: 'Berita yang akan diedit tidak ditemukan.' }, 404);
    }

    const summary = content.replace(/\s+/g, ' ').slice(0, 180);
    const update = hasNewImage
      ? await context.env.DB.prepare(`
          UPDATE articles
          SET title = ?,
              content = ?,
              summary = ?,
              category_id = ?,
              image_url = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(title, content, summary, categoryId, imageUrl, articleId).run()
      : await context.env.DB.prepare(`
          UPDATE articles
          SET title = ?,
              content = ?,
              summary = ?,
              category_id = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(title, content, summary, categoryId, articleId).run();

    if (!update.success) {
      throw new Error('Database tidak berhasil menyimpan perubahan berita.');
    }

    return json({
      success: true,
      message: hasNewImage
        ? 'Perubahan berita dan foto berhasil disimpan ke database.'
        : 'Perubahan berita berhasil disimpan ke database.',
      article: {
        id: articleId,
        title,
        content,
        summary,
        category_id: categoryId,
        category_name: category.name,
        image_url: hasNewImage ? imageUrl : (existing.image_url || ''),
      },
    });
  } catch (error) {
    console.error('ADMIN ARTICLES POST ERROR:', error);
    return json({
      success: false,
      message: 'Gagal menyimpan perubahan berita ke database.',
    }, 500);
  }
}

export async function onRequestPut(context: any) {
  if (!isSameOriginRequest(context.request)) {
    return json({ success: false, message: 'Asal permintaan tidak diizinkan.' }, 403);
  }

  try {
    const admin = await verifyAdmin(context);
    if (!admin) {
      return json({
        success: false,
        message: 'Sesi admin tidak ditemukan atau sudah berakhir. Silakan login kembali.',
      }, 401);
    }

    let body: any;
    try {
      body = await context.request.json();
    } catch {
      return json({ success: false, message: 'Data pemulihan tidak valid.' }, 400);
    }

    const articleId = Number(body.article_id);
    if (!Number.isSafeInteger(articleId) || articleId < 1) {
      return json({ success: false, message: 'ID berita tidak valid.' }, 400);
    }

    const existing = await context.env.DB.prepare(
      'SELECT id, status FROM articles WHERE id = ? LIMIT 1'
    ).bind(articleId).first<any>();

    if (!existing) {
      return json({ success: false, message: 'Berita tidak ditemukan.' }, 404);
    }
    if (existing.status !== 'deleted') {
      return json({
        success: false,
        message: 'Berita ini tidak berstatus terhapus sehingga tidak perlu dipulihkan.',
      }, 409);
    }

    const result = await context.env.DB.prepare(`
      UPDATE articles
      SET status = 'published', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'deleted'
    `).bind(articleId).run();

    if (!result.success || (result.meta?.changes ?? 1) < 1) {
      throw new Error('Database gagal memulihkan status berita.');
    }

    return json({
      success: true,
      message: 'Berita berhasil dipulihkan dan diterbitkan kembali.',
      article_id: articleId,
      status: 'published',
    });
  } catch (error) {
    console.error('ADMIN ARTICLES PUT ERROR:', error);
    return json({ success: false, message: 'Gagal memulihkan berita ke database.' }, 500);
  }
}

export async function onRequestDelete(context: any) {
  if (!isSameOriginRequest(context.request)) {
    return json({ success: false, message: 'Asal permintaan tidak diizinkan.' }, 403);
  }

  try {
    const admin = await verifyAdmin(context);
    if (!admin) {
      return json({
        success: false,
        message: 'Sesi admin tidak ditemukan atau sudah berakhir. Silakan login kembali.',
      }, 401);
    }

    let body: any;
    try {
      body = await context.request.json();
    } catch {
      return json({ success: false, message: 'Data permintaan penghapusan tidak valid.' }, 400);
    }

    const articleId = Number(body.article_id);
    if (!Number.isSafeInteger(articleId) || articleId < 1) {
      return json({ success: false, message: 'ID berita tidak valid.' }, 400);
    }

    const existing = await context.env.DB.prepare(
      'SELECT id, status FROM articles WHERE id = ? LIMIT 1'
    ).bind(articleId).first<any>();

    if (!existing) {
      return json({ success: false, message: 'Berita tidak ditemukan.' }, 404);
    }

    const result = await context.env.DB.prepare(
      `UPDATE articles SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(articleId).run();

    if (!result.success) {
      throw new Error('Database gagal memperbarui status berita.');
    }

    return json({
      success: true,
      message: 'Berita berhasil dihapus dari publikasi dan dipindahkan ke daftar Berita Dihapus.',
      article_id: articleId,
      status: 'deleted',
    });
  } catch (error) {
    console.error('ADMIN ARTICLES DELETE ERROR:', error);
    return json({ success: false, message: 'Gagal menghapus berita dari database.' }, 500);
  }
}
