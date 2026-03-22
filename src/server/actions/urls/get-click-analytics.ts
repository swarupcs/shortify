'use server';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { clickEvents, urls } from '@/server/db/schema';
import { eq, sql, and, gte, desc } from 'drizzle-orm';
import { subDays } from 'date-fns';

export type CountryClickData = { country: string; clicks: number };
export type TimeSeriesData = { date: string; clicks: number };
export type ReferrerData = { referrer: string; clicks: number };

export type ClickAnalytics = {
  byCountry: CountryClickData[];
  timeSeries: TimeSeriesData[];
  byReferrer: ReferrerData[];
};

export async function getClickAnalytics(
  userId: string,
): Promise<{ success: boolean; data?: ClickAnalytics; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user || session.user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get all urlIds belonging to this user
    const userUrls = await db.query.urls.findMany({
      where: (urls, { eq }) => eq(urls.userId, userId),
      columns: { id: true },
    });

    if (userUrls.length === 0) {
      return {
        success: true,
        data: { byCountry: [], timeSeries: [], byReferrer: [] },
      };
    }

    const urlIds = userUrls.map((u) => u.id);
    const thirtyDaysAgo = subDays(new Date(), 30);

    // ── Country breakdown (top 10) ─────────────────────────────────────
    const countryRows = await db
      .select({
        country: clickEvents.country,
        clicks: sql<number>`count(*)::int`,
      })
      .from(clickEvents)
      .where(
        and(
          sql`${clickEvents.urlId} = ANY(ARRAY[${sql.join(urlIds.map(id => sql`${id}`), sql`, `)}])`,
          gte(clickEvents.clickedAt, thirtyDaysAgo),
        ),
      )
      .groupBy(clickEvents.country)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const byCountry: CountryClickData[] = countryRows.map((r) => ({
      country: r.country || 'Unknown',
      clicks: r.clicks,
    }));

    // ── Time series (last 30 days, grouped by day) ─────────────────────
    const timeRows = await db
      .select({
        date: sql<string>`date_trunc('day', ${clickEvents.clickedAt})::date::text`,
        clicks: sql<number>`count(*)::int`,
      })
      .from(clickEvents)
      .where(
        and(
          sql`${clickEvents.urlId} = ANY(ARRAY[${sql.join(urlIds.map(id => sql`${id}`), sql`, `)}])`,
          gte(clickEvents.clickedAt, thirtyDaysAgo),
        ),
      )
      .groupBy(sql`date_trunc('day', ${clickEvents.clickedAt})`)
      .orderBy(sql`date_trunc('day', ${clickEvents.clickedAt})`);

    const timeSeries: TimeSeriesData[] = timeRows.map((r) => ({
      date: r.date,
      clicks: r.clicks,
    }));

    // ── Referrer breakdown (top 5) ─────────────────────────────────────
    const referrerRows = await db
      .select({
        referrer: clickEvents.referrer,
        clicks: sql<number>`count(*)::int`,
      })
      .from(clickEvents)
      .where(
        and(
          sql`${clickEvents.urlId} = ANY(ARRAY[${sql.join(urlIds.map(id => sql`${id}`), sql`, `)}])`,
          gte(clickEvents.clickedAt, thirtyDaysAgo),
        ),
      )
      .groupBy(clickEvents.referrer)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const byReferrer: ReferrerData[] = referrerRows.map((r) => ({
      referrer: r.referrer || 'Direct',
      clicks: r.clicks,
    }));

    return { success: true, data: { byCountry, timeSeries, byReferrer } };
  } catch (error) {
    console.error('Error getting click analytics:', error);
    return { success: false, error: 'Failed to load analytics' };
  }
}
