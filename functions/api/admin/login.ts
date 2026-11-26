function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function verifyPassword(password: string, stored: string) {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256' || parts[1] !== '310000') return false;
  const salt = new Uint8Array((parts[2].match(/.{2}/g) || []).map((x) => parseInt(x, 16)));
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 310000 }, material, 256);
  const actual = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return actual === parts[3];
}
export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json() as Record<string, unknown>;
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const admin = await context.env.DB.prepare('SELECT id, username, password_hash, is_active FROM admins WHERE username = ? LIMIT 1').bind(username).first<any>();
    if (!admin || Number(admin.is_active) !== 1 || !(await verifyPassword(password, String(admin.password_hash)))) return json({ success: false, message: 'Username atau password salah.' }, 401);
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    await context.env.DB.prepare('INSERT INTO admin_sessions (admin_id, session_token_hash, expires_at) VALUES (?, ?, ?)').bind(admin.id, tokenHash, expiresAt).run();
    return json({ success: true, username: admin.username }, 200, { 'Set-Cookie': `wk_admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800` });
  } catch {
    return json({ success: false, message: 'Login gagal diproses.' }, 500);
  }
}
