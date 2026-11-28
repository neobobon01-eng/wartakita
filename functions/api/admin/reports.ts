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

// Mengambil seluruh laporan langsung dari D1.
export async function onRequestGet(context: any) {
  try {
    const admin = await verifyAdmin(context);

    if (!admin) {
      return json({
        success: false,
        message: 'Sesi admin tidak valid. Silakan login kembali.',
      }, 401);
    }

    const url = new URL(context.request.url);
    const requestedPage = Number(url.searchParams.get('page') || 1);
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, 1000000)
      : 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const countResult = await context.env.DB.prepare(
      'SELECT COUNT(*) AS total FROM article_reports'
    ).first<any>();
    const total = Number(countResult?.total || 0);

    const result = await context.env.DB.prepare(`
      SELECT
        r.id,
        r.article_id,
        r.reporter_name,
        r.reporter_whatsapp,
        r.reason,
        r.description,
        r.status,
        r.reviewed_by,
        r.reviewed_at,
        r.created_at,
        a.title AS article_title,
        a.slug AS article_slug,
        a.status AS article_status
      FROM article_reports r
      LEFT JOIN articles a ON a.id = r.article_id
      ORDER BY
        CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
        r.created_at DESC,
        r.id DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return json({
      success: true,
      page,
      limit,
      total,
      hasMore: offset + result.results.length < total,
      reports: result.results || [],
    });
  } catch (error) {
    console.error('ADMIN REPORTS GET ERROR:', error);

    return json({
      success: false,
      message: 'Gagal mengambil daftar laporan.',
    }, 500);
  }
}

// Menandai satu laporan sebagai sudah diperiksa.
export async function onRequestPatch(context: any) {
  if (!isSameOriginRequest(context.request)) {
    return json({ success: false, message: 'Asal permintaan tidak diizinkan.' }, 403);
  }

  try {
    const admin = await verifyAdmin(context);

    if (!admin) {
      return json({
        success: false,
        message: 'Sesi admin tidak valid. Silakan login kembali.',
      }, 401);
    }

    let body: any;

    try {
      body = await context.request.json();
    } catch {
      return json({
        success: false,
        message: 'Data pemeriksaan tidak valid.',
      }, 400);
    }

    const reportId = Number(body.report_id);

    if (!Number.isSafeInteger(reportId) || reportId < 1) {
      return json({
        success: false,
        message: 'ID laporan tidak valid.',
      }, 400);
    }

    const existing = await context.env.DB.prepare(
      'SELECT id, status FROM article_reports WHERE id = ? LIMIT 1'
    ).bind(reportId).first<any>();

    if (!existing) {
      return json({
        success: false,
        message: 'Laporan tidak ditemukan.',
      }, 404);
    }

    if (existing.status !== 'pending') {
      return json({
        success: false,
        message: 'Laporan ini sudah pernah diperiksa.',
      }, 409);
    }

    const result = await context.env.DB.prepare(`
      UPDATE article_reports
      SET
        status = 'reviewed',
        reviewed_by = ?,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'pending'
    `).bind(admin.id, reportId).run();

    if (!result.success || (result.meta?.changes ?? 0) !== 1) {
      throw new Error('Database gagal memperbarui status laporan.');
    }

    return json({
      success: true,
      message: 'Laporan berhasil ditandai sudah diperiksa.',
      report_id: reportId,
      status: 'reviewed',
    });
  } catch (error) {
    console.error('ADMIN REPORTS PATCH ERROR:', error);

    return json({
      success: false,
      message: 'Gagal memperbarui status laporan.',
    }, 500);
  }
}
