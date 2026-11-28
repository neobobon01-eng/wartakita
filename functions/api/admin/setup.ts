import { isSameOriginRequest } from '../_utils/origin';
import { checkPublicRateLimit } from '../_utils/rate-limit';

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

const ITERATIONS = 100000;

async function derivePassword(password: string, salt: Uint8Array) {
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
      iterations: ITERATIONS,
    },
    material,
    256
  );

  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestGet(context: any) {
  const row = await context.env.DB
    .prepare('SELECT COUNT(*) AS total FROM admins')
    .first<{ total: number }>();

  return json({
    success: true,
    configured: Number(row?.total || 0) > 0,
  });
}

export async function onRequestPost(context: any) {
  if (!isSameOriginRequest(context.request)) {
    return json({ success: false, message: 'Asal permintaan tidak diizinkan.' }, 403);
  }

  let stage = 'memeriksa_status_setup';

  try {
    // Setup hanya boleh berjalan sebelum akun admin pertama dibuat.
    // Setelah admin tersedia, endpoint ditutup permanen agar tidak bisa
    // digunakan untuk mencoba ulang atau mengganti akun admin.
    const existing = await context.env.DB
      .prepare('SELECT COUNT(*) AS total FROM admins')
      .first<{ total: number }>();

    if (Number(existing?.total || 0) > 0) {
      return json({
        success: false,
        message: 'Akun admin sudah dibuat. Endpoint setup awal telah dinonaktifkan.',
      }, 409);
    }

    stage = 'membatasi_percobaan_setup';

    const ipAddress = context.request.headers.get('CF-Connecting-IP');
    if (!ipAddress) {
      return json({
        success: false,
        message: 'Permintaan tidak dapat diverifikasi.',
      }, 503);
    }

    const rateLimit = await checkPublicRateLimit(
      context.env.DB,
      ipAddress,
      'admin-setup',
      3,
      60 * 60,
      60 * 60
    );

    if (!rateLimit.allowed) {
      return Response.json(
        {
          success: false,
          message: 'Terlalu banyak percobaan setup. Silakan coba lagi nanti.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    stage = 'membaca_data_form';

    let body: Record<string, unknown>;
    try {
      body = await context.request.json() as Record<string, unknown>;
    } catch {
      return json({ success: false, message: 'Data setup tidak valid.' }, 400);
    }

    stage = 'memeriksa_kode_setup';

    const secret = String(body.setup_secret || '');
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (
      !context.env.ADMIN_SETUP_SECRET ||
      String(context.env.ADMIN_SETUP_SECRET).length < 32 ||
      secret !== context.env.ADMIN_SETUP_SECRET
    ) {
      return json({
        success: false,
        message: 'Kode setup tidak cocok.',
      }, 403);
    }

    stage = 'memeriksa_username_password';

    if (
      username !== 'Agusto' ||
      password.length < 12 ||
      password.length > 200
    ) {
      return json({
        success: false,
        message: 'Username harus Agusto dan password minimal 12 karakter.',
      }, 400);
    }

    // Periksa ulang tepat sebelum proses pembuatan untuk mengurangi
    // kemungkinan dua permintaan setup berjalan bersamaan.
    stage = 'memeriksa_akun_admin';

    const latest = await context.env.DB
      .prepare('SELECT COUNT(*) AS total FROM admins')
      .first<{ total: number }>();

    if (Number(latest?.total || 0) > 0) {
      return json({
        success: false,
        message: 'Akun admin sudah dibuat. Setup awal tidak dapat diulang.',
      }, 409);
    }

    stage = 'membuat_salt';

    const salt = crypto.getRandomValues(new Uint8Array(16));

    const saltHex = Array.from(salt)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    stage = 'membuat_hash_password';

    const hash = await derivePassword(password, salt);

    const stored =
      `pbkdf2_sha256$${ITERATIONS}$${saltHex}$${hash}`;

    stage = 'menyimpan_akun_admin';

    await context.env.DB
      .prepare(
        'INSERT INTO admins (username, password_hash, full_name, is_active) VALUES (?, ?, ?, 1)'
      )
      .bind(username, stored, username)
      .run();

    return json({
      success: true,
      message: 'Akun admin Agusto berhasil dibuat. Silakan login.',
    });

  } catch (error) {
    console.error('WARTAKITA ADMIN SETUP ERROR:', stage, error);

    return json({
      success: false,
      message: 'Setup gagal pada tahap: ' + stage,
    }, 500);
  }
}
