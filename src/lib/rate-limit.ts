type WindowEntry = { count: number; resetAt: number };

const store = new Map<string, WindowEntry>();
const MAX_TRACKED_KEYS = 5000;

function pruneExpired(now: number): void {
  if (store.size < MAX_TRACKED_KEYS) return;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

// Fixed-window in-memory limiter. Suitable for a single-instance deployment;
// swap for a shared store (e.g. Redis/Upstash) if the app scales horizontally.
export function consumeRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  pruneExpired(now);

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count += 1;
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
