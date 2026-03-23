'use server';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { clickEvents, urls } from '@/server/db/schema';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { subDays } from 'date-fns';

export type LinkAnalytics = {
  shortCode:   string;
  originalUrl: string;
  totalClicks: number;
  timeSeries:  { date: string; clicks: number }[];
  byCountry:   { country:  string; clicks: number }[];
  byReferrer:  { referrer: string; clicks: number }[];
  byDevice:    { device:   string; clicks: number }[];
  byBrowser:   { browser:  string; clicks: number }[];
};

export async function getLinkAnalytics(urlId: number): Promise<{
  success: boolean;
  data?: LinkAnalytics;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    // Verify ownership
    const url = await db.query.urls.findFirst({
      where: and(eq(urls.id, urlId), eq(urls.userId, session.user.id)),
      columns: { id: true, shortCode: true, originalUrl: true, clicks: true },
    });

    if (!url) return { success: false, error: 'URL not found' };

    const thirtyDaysAgo = subDays(new Date(), 30);
    const whereClause   = and(eq(clickEvents.urlId, urlId), gte(clickEvents.clickedAt, thirtyDaysAgo));

    const [timeRows, countryRows, referrerRows, deviceRows, browserRows] = await Promise.all([
      db
        .select({
          date:   sql<string>`date_trunc('day', ${clickEvents.clickedAt})::date::text`,
          clicks: sql<number>`count(*)::int`,
        })
        .from(clickEvents)
        .where(whereClause)
        .groupBy(sql`date_trunc('day', ${clickEvents.clickedAt})`)
        .orderBy(sql`date_trunc('day', ${clickEvents.clickedAt})`),

      db
        .select({ country: clickEvents.country, clicks: sql<number>`count(*)::int` })
        .from(clickEvents)
        .where(whereClause)
        .groupBy(clickEvents.country)
        .orderBy(desc(sql`count(*)`))
        .limit(10),

      db
        .select({ referrer: clickEvents.referrer, clicks: sql<number>`count(*)::int` })
        .from(clickEvents)
        .where(whereClause)
        .groupBy(clickEvents.referrer)
        .orderBy(desc(sql`count(*)`))
        .limit(5),

      db
        .select({ device: clickEvents.device, clicks: sql<number>`count(*)::int` })
        .from(clickEvents)
        .where(whereClause)
        .groupBy(clickEvents.device)
        .orderBy(desc(sql`count(*)`)),

      db
        .select({ browser: clickEvents.browser, clicks: sql<number>`count(*)::int` })
        .from(clickEvents)
        .where(whereClause)
        .groupBy(clickEvents.browser)
        .orderBy(desc(sql`count(*)`))
        .limit(6),
    ]);

    return {
      success: true,
      data: {
        shortCode:   url.shortCode,
        originalUrl: url.originalUrl,
        totalClicks: url.clicks,
        timeSeries:  timeRows.map((r)    => ({ date:     r.date,                  clicks: r.clicks })),
        byCountry:   countryRows.map((r) => ({ country:  r.country  || 'Unknown', clicks: r.clicks })),
        byReferrer:  referrerRows.map((r) => ({ referrer: r.referrer || 'Direct',  clicks: r.clicks })),
        byDevice:    deviceRows.map((r)  => ({ device:   r.device   || 'Unknown', clicks: r.clicks })),
        byBrowser:   browserRows.map((r) => ({ browser:  r.browser  || 'Other',   clicks: r.clicks })),
      },
    };
  } catch (error) {
    console.error('[link-analytics] Error:', error);
    return { success: false, error: 'Failed to load link analytics' };
  }
}
