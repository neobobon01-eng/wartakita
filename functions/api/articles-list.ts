
export async function onRequestGet(context: any) {
  try {
    const result = await context.env.DB.prepare(
      `SELECT
        articles.id,
        articles.title,
        articles.slug,
        articles.content,
        articles.summary,
        articles.author_name,
        articles.image_url,
        articles.views,
        articles.created_at,
        categories.name AS category_name,
        categories.slug AS category_slug
      FROM articles
      LEFT JOIN categories
        ON articles.category_id = categories.id
      WHERE articles.status = 'published'
      ORDER BY articles.created_at DESC
      LIMIT 50`
    ).all();

    return Response.json({
      success: true,
      message: "Daftar berita berhasil diambil.",
      total: result.results.length,
      articles: result.results
    });

  } catch (error) {
    return Response.json({
      success: false,
      message: "Gagal mengambil daftar berita."
    }, { status: 500 });
  }
}
