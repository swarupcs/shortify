import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { urls, counters } from '@/server/db/schema';
import { lt, and, isNotNull } from 'drizzle-orm';
import { pruneRateLimits } from '@/lib/rate-limit';

/**
 * GET /api/cron/expire-urls
 *
 * Called by Vercel Cron (or any scheduler) to:
 *   1. Hard-delete URLs that expired more than 7 days ago
 *   2. Prune stale rate_limits rows (older than 2 hours)
 *
 * vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/expire-urls", "schedule": "0 3 * * *" }]
 * }
 *
 * Set CRON_SECRET env var and pass as: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ── 1. Delete expired URLs ─────────────────────────────────────────
    const deleted = await db
      .delete(urls)
      .where(
        and(
          isNotNull(urls.expiresAt),
          lt(urls.expiresAt, sevenDaysAgo),
        ),
      )
      .returning({ id: urls.id });

    console.log(`[cron] Deleted ${deleted.length} expired URLs`);

    // ── 2. Reset daily AI scan counter ────────────────────────────────
    await db
      .insert(counters)
      .values({ key: 'ai_scans_today', value: 0, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: counters.key,
        set: { value: 0, updatedAt: new Date() },
      });
    console.log('[cron] Reset ai_scans_today counter');

    // ── 3. Prune stale rate limit rows ────────────────────────────────
    const prunedRateLimits = await pruneRateLimits();
    console.log(`[cron] Pruned ${prunedRateLimits} stale rate limit rows`);

    return NextResponse.json({
      success: true,
      deletedUrls: deleted.length,
      prunedRateLimits,
      aiScanCounterReset: true,
      cutoff: sevenDaysAgo.toISOString(),
    });
  } catch (error) {
    console.error('[cron] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
