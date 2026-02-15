const limit = 10;
const windowMs = 60 * 1000; // 1 minute
const store = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function checkRateLimit(request: Request): { ok: boolean; remaining: number } {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}
