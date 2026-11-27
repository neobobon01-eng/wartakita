function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

/**
 * Menerima laporan dari pembaca dan menyimpannya ke D1.
 * Dashboard admin membaca laporan pending dari tabel article_reports.
 */
export async function onRequestPost(context: any) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await context.request.json() as Record<string, unknown>;
    } catch {
      return json({ success: false, message: 'Data laporan tidak valid.' }, 400);
    }

    const articleId = Number(body.article_id);
    const reason = typeof body.reason === 'string'
      ? body.reason.trim().replace(/\s+/g, ' ')
      : '';

    if (!Number.isSafeInteger(articleId) || articleId < 1) {
      return json({ success: false, message: 'Berita yang dilaporkan tidak valid.' }, 400);
    }

    if (reason.length < 5 || reason.length > 1000) {
      return json({
        success: false,
        message: 'Alasan laporan harus berisi 5 sampai 1.000 karakter.',
      }, 400);
    }

    const article = await context.env.DB.prepare(
      `SELECT id FROM articles WHERE id = ? AND status = 'published' LIMIT 1`
    ).bind(articleId).first<{ id: number }>();

    if (!article) {
      return json({
        success: false,
        message: 'Berita tidak ditemukan atau sudah tidak diterbitkan.',
      }, 404);
    }

    const result = await context.env.DB.prepare(
      `INSERT INTO article_reports (article_id, reason, status, created_at)
       VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)`
    ).bind(articleId, reason).run();

    if (!result.success || (result.meta?.changes ?? 0) !== 1) {
      throw new Error('Database tidak mengonfirmasi penyimpanan laporan.');
    }

    return json({
      success: true,
      message: 'Laporan berhasil disimpan dan menunggu pemeriksaan admin.',
      report: {
        article_id: articleId,
        reason,
        status: 'pending',
      },
    }, 201);
  } catch (error) {
    console.error('ARTICLE REPORT CREATE ERROR:', error);
    return json({
      success: false,
      message: 'Laporan gagal disimpan ke database. Silakan coba lagi.',
    }, 500);
  }
}
