type RateLimitRow = {
  attempts: number;
  window_started_at: number;
  blocked_until: number | null;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfter: number;
};

/**
 * Membatasi permintaan berdasarkan alamat IP dari Cloudflare.
 * Hanya hash IP dan nama endpoint yang disimpan di D1.
 */
export async function checkPublicRateLimit(
  db: any,
  ipAddress: string,
  scope: string,
  maxAttempts: number,
  windowSeconds: number,
  blockSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const keyMaterial = new TextEncoder().encode(`${scope}:${ipAddress}`);
  const digest = await crypto.subtle.digest("SHA-256", keyMaterial);
  const keyHash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const row = await db.prepare(
    `INSERT INTO public_api_rate_limits (
       key_hash, attempts, window_started_at, blocked_until, updated_at
     )
     VALUES (?, 1, ?, NULL, ?)
     ON CONFLICT(key_hash) DO UPDATE SET
       attempts = CASE
         WHEN public_api_rate_limits.blocked_until IS NOT NULL
              AND public_api_rate_limits.blocked_until > excluded.updated_at
           THEN public_api_rate_limits.attempts
         WHEN (public_api_rate_limits.blocked_until IS NOT NULL
               AND public_api_rate_limits.blocked_until <= excluded.updated_at)
              OR excluded.updated_at - public_api_rate_limits.window_started_at >= ?
           THEN 1
         ELSE public_api_rate_limits.attempts + 1
       END,
       window_started_at = CASE
         WHEN public_api_rate_limits.blocked_until IS NOT NULL
              AND public_api_rate_limits.blocked_until > excluded.updated_at
           THEN public_api_rate_limits.window_started_at
         WHEN (public_api_rate_limits.blocked_until IS NOT NULL
               AND public_api_rate_limits.blocked_until <= excluded.updated_at)
              OR excluded.updated_at - public_api_rate_limits.window_started_at >= ?
           THEN excluded.updated_at
         ELSE public_api_rate_limits.window_started_at
       END,
       blocked_until = CASE
         WHEN public_api_rate_limits.blocked_until IS NOT NULL
              AND public_api_rate_limits.blocked_until > excluded.updated_at
           THEN public_api_rate_limits.blocked_until
         WHEN (public_api_rate_limits.blocked_until IS NOT NULL
               AND public_api_rate_limits.blocked_until <= excluded.updated_at)
              OR excluded.updated_at - public_api_rate_limits.window_started_at >= ?
           THEN NULL
         WHEN public_api_rate_limits.attempts + 1 > ?
           THEN excluded.updated_at + ?
         ELSE NULL
       END,
       updated_at = excluded.updated_at
     RETURNING attempts, window_started_at, blocked_until`
  ).bind(
    keyHash,
    now,
    now,
    windowSeconds,
    windowSeconds,
    windowSeconds,
    maxAttempts,
    blockSeconds
  ).first<RateLimitRow>();

  if (!row) {
    throw new Error("Pemeriksaan batas permintaan tidak menghasilkan data.");
  }

  if (row.blocked_until !== null && row.blocked_until > now) {
    return {
      allowed: false,
      retryAfter: Math.max(1, row.blocked_until - now)
    };
  }

  return { allowed: true, retryAfter: 0 };
}
