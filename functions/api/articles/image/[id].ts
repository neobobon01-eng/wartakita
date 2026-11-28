export async function onRequestGet(context: any): Promise<Response> {
  try {
    const id = Number(context.params?.id);
    if (!Number.isSafeInteger(id) || id < 1) return new Response("Gambar tidak ditemukan.", {status:404});
    const article = await context.env.DB.prepare(
      "SELECT image_url FROM articles WHERE id = ? AND status = 'published' LIMIT 1"
    ).bind(id).first<{image_url:string|null}>();
    const value = typeof article?.image_url === "string" ? article.image_url : "";
    const match = value.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i);
    if (!match) return new Response("Gambar tidak ditemukan.", {status:404,headers:{"Cache-Control":"no-store"}});
    const mime = `image/${match[1].toLowerCase()}`;
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    return new Response(bytes,{status:200,headers:{
      "Content-Type":mime,"Content-Length":String(bytes.byteLength),
      "Cache-Control":"public, max-age=300","X-Content-Type-Options":"nosniff",
      "Cross-Origin-Resource-Policy":"cross-origin"
    }});
  } catch(error) {
    console.error("ARTICLE IMAGE ERROR:",error);
    return new Response("Gambar tidak dapat dimuat.",{status:500,headers:{"Cache-Control":"no-store"}});
  }
}
