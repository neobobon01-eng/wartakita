
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

export async function onRequestGet(context: any) {
  try {
    // 1. Periksa cookie sesi admin
    const cookie = context.request.headers.get('Cookie') || '';

    const token = cookie
      .split(';')
      .map((item: string) => item.trim())
      .find((item: string) => item.startsWith('wk_admin_session='))
      ?.slice('wk_admin_session='.length);

    if (!token) {
      return json({
        success: false,
        message: 'Sesi admin tidak ditemukan.',
      }, 401);
    }

    // 2. Verifikasi sesi di database
    const tokenHash = await sha256(token);

    const admin = await context.env.DB.prepare(`
      SELECT a.id, a.username
      FROM admin_sessions s
      INNER JOIN admins a ON a.id = s.admin_id
      WHERE s.session_token_hash = ?
        AND s.expires_at > CURRENT_TIMESTAMP
        AND a.is_active = 1
      LIMIT 1
    `).bind(tokenHash).first<any>();

    if (!admin) {
      return json({
        success: false,
        message: 'Sesi admin tidak valid atau sudah berakhir.',
      }, 401);
    }

    // 3. Ambil seluruh berita dari D1
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
    console.error('ADMIN ARTICLES ERROR:', error);

    return json({
      success: false,
      message: 'Gagal mengambil data berita admin.',
    }, 500);
  }
}
