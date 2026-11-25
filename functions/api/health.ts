
export async function onRequestGet(context) {
  try {
    const result = await context.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    ).all();

    return Response.json({
      success: true,
      message: "Koneksi database WARTAKITA berhasil!",
      tables: result.results
    });

  } catch (error) {
    return Response.json({
      success: false,
      message: "Koneksi database gagal."
    }, { status: 500 });
  }
}
