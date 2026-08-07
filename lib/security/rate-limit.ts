type Bucket = { count: number; resetsAt: number };
type RateLimitStore = Map<string, Bucket>;

const globalRateLimits = globalThis as typeof globalThis & { __pulseRateLimits?: RateLimitStore };
const store = globalRateLimits.__pulseRateLimits ?? new Map<string, Bucket>();
globalRateLimits.__pulseRateLimits = store;

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export function requestRateLimitKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? forwarded ?? "unknown";
  return `${scope}:${address}`;
}

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const current = store.get(key);
  if (!current || current.resetsAt <= now) {
    store.set(key, { count: 1, resetsAt: now + windowMs });
    pruneExpired(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetsAt - now) / 1000)) };
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function pruneExpired(now: number) {
  if (store.size < 2_000) return;
  for (const [key, bucket] of store) if (bucket.resetsAt <= now) store.delete(key);
}

export function resetRateLimitsForTests() {
  if (process.env.NODE_ENV === "test") store.clear();
}
