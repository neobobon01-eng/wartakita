export async function onRequestGet(context) {
  try {
    await context.env.DB.prepare("SELECT 1").first();

    return Response.json({
      success: true,
      message: "Layanan WARTAKITA berjalan."
    });
  } catch {
    return Response.json({
      success: false,
      message: "Layanan sementara tidak tersedia."
    }, { status: 500 });
  }
}
