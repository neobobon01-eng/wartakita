
function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );

  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password: string, stored: string) {
  const parts = stored.split('$');

  if (
    parts.length !== 4 ||
    parts[0] !== 'pbkdf2_sha256' ||
    parts[1] !== '100000' ||
    !/^[0-9a-f]{32}$/i.test(parts[2]) ||
    !/^[0-9a-f]{64}$/i.test(parts[3])
  ) {
    return false;
  }

  const salt = new Uint8Array(
    (parts[2].match(/.{2}/g) || []).map((x) => parseInt(x, 16))
  );

  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 100000,
    },
    material,
    256
  );

  const actual = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return actual === parts[3];
}

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 5;
const BLOCK_SECONDS = 15 * 60;

export async function onRequestPost(context: any) {
  try {
    let body: Record<string, unknown>;

    try {
      body = await context.request.json();
    } catch {
      return json({
        success: false,
        message: 'Data login tidak valid.',
      }, 400);
    }

    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (
      !username ||
      username.length > 100 ||
      !password ||
      password.length > 200
    ) {
      return json({
        success: false,
        message: 'Username atau password salah.',
      }, 401);
    }

    const ip =
      context.request.headers.get('CF-Connecting-IP') || 'unknown';

    const keyHash = await sha256(
      `${ip}:${username.toLowerCase()}`
    );

    const now = Math.floor(Date.now() / 1000);

    const attempt = await context.env.DB
      .prepare(`
        SELECT attempts, window_started_at, blocked_until
        FROM admin_login_attempts
        WHERE key_hash = ?
        LIMIT 1
      `)
      .bind(keyHash)
      .first<any>();

    if (
      attempt &&
      Number(attempt.blocked_until || 0) > now
    ) {
      const retryAfter =
        Number(attempt.blocked_until) - now;

      return json({
        success: false,
        message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.',
      }, 429, {
        'Retry-After': String(retryAfter),
      });
    }

    const windowExpired =
      !attempt ||
      now - Number(attempt.window_started_at) >= WINDOW_SECONDS;

    const admin = await context.env.DB
      .prepare(`
        SELECT id, username, password_hash, is_active
        FROM admins
        WHERE username = ?
        LIMIT 1
      `)
      .bind(username)
      .first<any>();

    const validLogin =
      !!admin &&
      Number(admin.is_active) === 1 &&
      await verifyPassword(password, String(admin.password_hash));

    if (!validLogin) {
      const nextAttempts = windowExpired
        ? 1
        : Number(attempt.attempts) + 1;

      const blockedUntil =
        nextAttempts >= MAX_ATTEMPTS
          ? now + BLOCK_SECONDS
          : null;

      if (windowExpired) {
        await context.env.DB.prepare(`
          INSERT INTO admin_login_attempts
            (key_hash, attempts, window_started_at, blocked_until, updated_at)
          VALUES (?, 1, ?, NULL, ?)
          ON CONFLICT(key_hash) DO UPDATE SET
            attempts = 1,
            window_started_at = excluded.window_started_at,
            blocked_until = NULL,
            updated_at = excluded.updated_at
        `).bind(keyHash, now, now).run();
      } else {
        await context.env.DB.prepare(`
          UPDATE admin_login_attempts
          SET attempts = ?,
              blocked_until = ?,
              updated_at = ?
          WHERE key_hash = ?
        `).bind(
          nextAttempts,
          blockedUntil,
          now,
          keyHash
        ).run();
      }

      if (nextAttempts >= MAX_ATTEMPTS) {
        return json({
          success: false,
          message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.',
        }, 429, {
          'Retry-After': String(BLOCK_SECONDS),
        });
      }

      return json({
        success: false,
        message: 'Username atau password salah.',
      }, 401);
    }

    // Login berhasil: hapus catatan kegagalan sebelumnya.
    await context.env.DB
      .prepare(
        'DELETE FROM admin_login_attempts WHERE key_hash = ?'
      )
      .bind(keyHash)
      .run();

    const tokenBytes = crypto.getRandomValues(
      new Uint8Array(32)
    );

    const token = Array.from(tokenBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const tokenHash = await sha256(token);

    const expiresAt = new Date(
      Date.now() + 8 * 60 * 60 * 1000
    ).toISOString();

    await context.env.DB
      .prepare(`
        INSERT INTO admin_sessions
          (admin_id, session_token_hash, expires_at)
        VALUES (?, ?, ?)
      `)
      .bind(admin.id, tokenHash, expiresAt)
      .run();

    return json(
      {
        success: true,
        username: admin.username,
      },
      200,
      {
        'Set-Cookie':
          `wk_admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`,
      }
    );
  } catch (error) {
    console.error('WARTAKITA ADMIN LOGIN ERROR:', error);

    return json({
      success: false,
      message: 'Login gagal diproses.',
    }, 500);
  }
}
