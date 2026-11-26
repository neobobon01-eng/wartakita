function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }
async function sha256(value: string) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join(''); }
export async function onRequestGet(context: any) {
  const cookie = context.request.headers.get('Cookie') || '';
  const token = cookie.split(';').map((x: string) => x.trim()).find((x: string) => x.startsWith('wk_admin_session='))?.slice('wk_admin_session='.length);
  if (!token) return json({ success: true, authenticated: false });
  const hash = await sha256(token);
  const row = await context.env.DB.prepare(`SELECT a.username FROM admin_sessions s INNER JOIN admins a ON a.id = s.admin_id WHERE s.session_token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND a.is_active = 1 LIMIT 1`).bind(hash).first<any>();
  return json({ success: true, authenticated: !!row, username: row?.username || '' });
}
