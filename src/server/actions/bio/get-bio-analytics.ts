'use server';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { bioPageViews, bioPages } from '@/server/db/schema';
import { and, eq, gte, sql, desc } from 'drizzle-orm';
import { subDays } from 'date-fns';

export type BioViewDay = { date: string; views: number };
export type BioAnalytics = {
  totalViews: number;
  viewsLast30Days: number;
  dailyViews: BioViewDay[];
};

export async function getBioAnalytics(): Promise<{
  success: boolean;
  data?: BioAnalytics;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const page = await db.query.bioPages.findFirst({
      where: eq(bioPages.userId, session.user.id),
      columns: { id: true },
    });

    if (!page) return { success: true, data: { totalViews: 0, viewsLast30Days: 0, dailyViews: [] } };

    const thirtyDaysAgo = subDays(new Date(), 30);

    const [totalResult, recentResult, dailyRows] = await Promise.all([
      // All-time total
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(bioPageViews)
        .where(eq(bioPageViews.bioPageId, page.id)),

      // Last 30 days total
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(bioPageViews)
        .where(and(
          eq(bioPageViews.bioPageId, page.id),
          gte(bioPageViews.viewedAt, thirtyDaysAgo),
        )),

      // Daily breakdown — last 30 days
      db
        .select({
          date:  sql<string>`date_trunc('day', ${bioPageViews.viewedAt})::date::text`,
          views: sql<number>`count(*)::int`,
        })
        .from(bioPageViews)
        .where(and(
          eq(bioPageViews.bioPageId, page.id),
          gte(bioPageViews.viewedAt, thirtyDaysAgo),
        ))
        .groupBy(sql`date_trunc('day', ${bioPageViews.viewedAt})`)
        .orderBy(sql`date_trunc('day', ${bioPageViews.viewedAt})`),
    ]);

    return {
      success: true,
      data: {
        totalViews:      totalResult[0]?.total  ?? 0,
        viewsLast30Days: recentResult[0]?.total ?? 0,
        dailyViews:      dailyRows.map((r) => ({ date: r.date, views: r.views })),
      },
    };
  } catch (error) {
    console.error('[bio-analytics] Error:', error);
    return { success: false, error: 'Failed to load bio analytics' };
  }
}
