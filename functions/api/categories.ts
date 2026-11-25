
export async function onRequestGet(context) {
  try {
    const result = await context.env.DB.prepare(
      `SELECT id, name, slug, description
       FROM categories
       WHERE is_active = 1
       ORDER BY id ASC`
    ).all();

    return Response.json({
      success: true,
      message: "Kategori berita berhasil diambil.",
      total: result.results.length,
      categories: result.results
    });

  } catch (error) {
    return Response.json({
      success: false,
      message: "Gagal mengambil kategori berita."
    }, { status: 500 });
  }
}
