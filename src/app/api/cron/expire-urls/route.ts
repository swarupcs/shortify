import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { urls } from '@/server/db/schema';
import { lt, and, isNotNull } from 'drizzle-orm';

/**
 * GET /api/cron/expire-urls
 *
 * Called by Vercel Cron (or any scheduler) to hard-delete URLs
 * that expired more than 7 days ago.
 *
 * Add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/expire-urls", "schedule": "0 3 * * *" }]
 * }
 *
 * Set env var CRON_SECRET to a random string and pass it as the
 * Authorization header: "Bearer <CRON_SECRET>"
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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

    return NextResponse.json({
      success: true,
      deleted: deleted.length,
      cutoff: sevenDaysAgo.toISOString(),
    });
  } catch (error) {
    console.error('[cron] Error deleting expired URLs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
