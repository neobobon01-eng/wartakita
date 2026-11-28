import { isSameOriginRequest } from '../_utils/origin';
async function sha256(value: string) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)); return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join(''); }
export async function onRequestPost(context: any) {
  if (!isSameOriginRequest(context.request)) {
    return Response.json(
      { success: false, message: 'Asal permintaan tidak diizinkan.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const cookie = context.request.headers.get('Cookie') || '';
  const token = cookie.split(';').map((x: string) => x.trim()).find((x: string) => x.startsWith('wk_admin_session='))?.slice('wk_admin_session='.length);
  if (token) await context.env.DB.prepare('DELETE FROM admin_sessions WHERE session_token_hash = ?').bind(await sha256(token)).run();
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store', 'Set-Cookie': 'wk_admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0' } });
}
