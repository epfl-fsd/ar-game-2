const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

/** Fixed-window rate limit per key (e.g. client IP). In-memory only: resets on restart and isn't shared across replicas. */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);

  if (recent.length > MAX_REQUESTS_PER_WINDOW) return true;

  hits.set(key, recent);
  return false;
}

/** Client IP from proxy headers (the app sits behind the OpenShift Route), falling back to a shared bucket. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
