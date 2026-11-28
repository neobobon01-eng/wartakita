function esc(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c] as string));
}

function notFound() {
  return new Response("Berita tidak ditemukan.", { status: 404, headers: { "Content-Type":"text/plain; charset=utf-8", "Cache-Control":"no-store" } });
}

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const slug = String(context.params?.slug || "").trim();
    if (!slug || slug.length > 120) return notFound();

    const a = await context.env.DB.prepare(`
      SELECT a.id, a.title, a.slug, a.content, a.summary, a.author_name, a.image_url, a.created_at,
             c.name AS category_name
      FROM articles a LEFT JOIN categories c ON c.id = a.category_id
      WHERE a.slug = ? AND a.status = 'published' LIMIT 1
    `).bind(slug).first<any>();
    if (!a) return notFound();

    const requestUrl = new URL(context.request.url);
    const origin = requestUrl.origin;
    const canonical = new URL(`/berita/${encodeURIComponent(a.slug)}`, origin).toString();
    const shareVersion = (requestUrl.searchParams.get("v") || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
    const rawImage = typeof a.image_url === "string" ? a.image_url.trim() : "";
    let image = "";
    if (/^data:image\/(jpeg|png|webp);base64,/i.test(rawImage)) {
      const imageUrl = new URL(`/api/articles/image/${encodeURIComponent(String(a.id))}`, origin);
      if (shareVersion) imageUrl.searchParams.set("v", shareVersion);
      image = imageUrl.toString();
    } else if (/^https:\/\//i.test(rawImage)) {
      image = rawImage;
    }

    const title = String(a.title || "Berita WARTAKITA");
    const description = String(a.summary || a.content || "Baca berita terbaru dari WARTAKITA.").slice(0, 300);
    const category = String(a.category_name || "Berita Warga");
    const author = String(a.author_name || "Redaksi WARTAKITA");
    const date = String(a.created_at || "");
    const t = esc(title), d = esc(description), u = esc(canonical), im = esc(image);
    const cat = esc(category), by = esc(author), dt = esc(date), body = esc(a.content || "");

    const imageTags = image ? `
  <meta property="og:image" content="${im}">
  <meta property="og:image:secure_url" content="${im}">
  <meta property="og:image:alt" content="${t}">
  <meta name="twitter:image" content="${im}">` : "";

    const html = `<!doctype html>
<html lang="id"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t} | WARTAKITA</title><meta name="description" content="${d}">
<link rel="canonical" href="${u}">
<meta property="og:site_name" content="WARTAKITA"><meta property="og:type" content="article">
<meta property="og:locale" content="id_ID"><meta property="og:url" content="${esc(requestUrl.toString())}">
<meta property="og:title" content="${t}"><meta property="og:description" content="${d}">${imageTags}
<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${t}"><meta name="twitter:description" content="${d}">
<meta property="article:section" content="${cat}"><meta property="article:published_time" content="${dt}">
<meta property="article:author" content="${by}">
<style>
*{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#172033;font-family:Arial,Helvetica,sans-serif;line-height:1.7}
header{background:#0b1f3a;padding:18px max(20px,calc((100% - 900px)/2))}header a{color:white;text-decoration:none;font-weight:800}
main{max-width:900px;margin:28px auto;padding:0 18px}article{background:white;border:1px solid #e2e8f0;border-radius:16px;padding:clamp(20px,4vw,42px)}
.category{color:#c2410c;font-size:13px;font-weight:700}h1{color:#0b1f3a;line-height:1.25;font-size:clamp(27px,5vw,40px);margin:10px 0 14px}
.meta{color:#64748b;font-size:14px;margin-bottom:24px}img{display:block;width:100%;max-height:560px;object-fit:contain;background:#f8fafc;border-radius:12px;margin-bottom:26px}
.summary{font-size:18px;font-weight:600;color:#334155;margin-bottom:22px}.content{white-space:pre-wrap;overflow-wrap:anywhere}
.back{display:inline-block;margin-top:24px;color:#c2410c;font-weight:700;text-decoration:none}footer{max-width:900px;margin:0 auto 30px;padding:0 18px;color:#64748b;font-size:13px}
</style></head><body><header><a href="/">WARTAKITA</a></header><main><article>
<div class="category">${cat}</div><h1>${t}</h1><div class="meta">Oleh ${by}${date ? ` · ${dt}` : ""}</div>
${image ? `<img src="${im}" alt="${t}" loading="eager">` : ""}
${description ? `<p class="summary">${d}</p>` : ""}<div class="content">${body}</div>
<a class="back" href="/">← Kembali ke WARTAKITA</a></article></main>
<footer>WARTAKITA — Berita dari Warga, Untuk Semua.</footer></body></html>`;

    return new Response(html, { status:200, headers:{
      "Content-Type":"text/html; charset=utf-8","Cache-Control":"public, max-age=60, s-maxage=300",
      "X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","X-Frame-Options":"DENY",
      "Content-Security-Policy":"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
    }});
  } catch (error) {
    console.error("ARTICLE SHARE PAGE ERROR:", error);
    return new Response("Terjadi kesalahan saat membuka berita.", { status:500, headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"} });
  }
}
