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

    const category = await context.env.DB.prepare(`
      SELECT id, name FROM categories WHERE id = ? LIMIT 1
    `).bind(categoryId).first<any>();

    if (!category) {
      return json({ success: false, message: 'Kategori berita tidak ditemukan.' }, 404);
    }

    const existing = await context.env.DB.prepare(`
      SELECT id FROM articles WHERE id = ? LIMIT 1
    `).bind(articleId).first<any>();

    if (!existing) {
      return json({ success: false, message: 'Berita yang akan diedit tidak ditemukan.' }, 404);
    }

    const summary = content.replace(/\s+/g, ' ').slice(0, 180);
    const update = await context.env.DB.prepare(`
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
      message: 'Perubahan berita berhasil disimpan ke database.',
      article: {
        id: articleId,
        title,
        content,
        summary,
        category_id: categoryId,
        category_name: category.name,
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
