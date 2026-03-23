import { db } from '@/server/db';
import { rateLimits } from '@/server/db/schema';
import { and, eq, lt, sql } from 'drizzle-orm';

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; remaining: 0; retryAfterSeconds: number };

/**
 * Sliding-window rate limiter backed by Postgres.
 *
 * Uses a 1-hour fixed window keyed on `key` (e.g. "shorten:192.168.1.1").
 * Atomically increments the counter for the current window via
 * INSERT ... ON CONFLICT DO UPDATE so there are no race conditions.
 *
 * @param key        Unique string identifying the actor + action, e.g. "shorten:1.2.3.4"
 * @param limit      Max allowed requests per window
 * @param windowMs   Window size in milliseconds (default: 1 hour)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs = 60 * 60 * 1000, // 1 hour
): Promise<RateLimitResult> {
  // Truncate current time to the window boundary
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const windowEnd = new Date(windowStart.getTime() + windowMs);

  // Atomically upsert the counter for this key + window
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  const currentCount = row?.count ?? 1;

  if (currentCount > limit) {
    const retryAfterSeconds = Math.ceil((windowEnd.getTime() - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: limit - currentCount };
}

/**
 * Delete stale rate limit rows older than 2 windows.
 * Call this from your /api/cron/expire-urls route or a dedicated cron.
 */
export async function pruneRateLimits(windowMs = 60 * 60 * 1000): Promise<number> {
  const cutoff = new Date(Date.now() - windowMs * 2);
  const deleted = await db
    .delete(rateLimits)
    .where(lt(rateLimits.windowStart, cutoff))
    .returning({ key: rateLimits.key });
  return deleted.length;
}

/**
 * Convenience: derive a rate limit key from a Next.js request's headers.
 * Falls back to "unknown" if no IP is detectable.
 */
export function ipFromHeaders(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}
