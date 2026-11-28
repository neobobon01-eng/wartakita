/**
 * Memastikan permintaan perubahan data berasal dari origin yang sama.
 * Browser mengirim header Origin pada permintaan POST, PUT, PATCH, dan DELETE.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('Origin');

  if (!origin) return false;

  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
