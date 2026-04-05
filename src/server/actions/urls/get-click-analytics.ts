'use server';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { clickEvents } from '@/server/db/schema';
import { and, desc, gte, sql, inArray } from 'drizzle-orm';
import { subDays } from 'date-fns';

export type CountryClickData  = { country:  string; clicks: number };
export type TimeSeriesData    = { date:     string; clicks: number };
export type ReferrerData      = { referrer: string; clicks: number };
export type DeviceData        = { device:   string; clicks: number };
export type BrowserData       = { browser:  string; clicks: number };

export type ClickAnalytics = {
  byCountry:  CountryClickData[];
  timeSeries: TimeSeriesData[];
  byReferrer: ReferrerData[];
  byDevice:   DeviceData[];
  byBrowser:  BrowserData[];
};

export async function getClickAnalytics(): Promise<{ success: boolean; data?: ClickAnalytics; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    const userId = session.user.id;

    const userUrls = await db.query.urls.findMany({
      where: (urls, { eq }) => eq(urls.userId, userId),
      columns: { id: true },
    });

    if (userUrls.length === 0) {
      return {
        success: true,
        data: { byCountry: [], timeSeries: [], byReferrer: [], byDevice: [], byBrowser: [] },
      };
    }

    const urlIds        = userUrls.map((u) => u.id);
    const thirtyDaysAgo = subDays(new Date(), 30);

    const inUrlIds = inArray(clickEvents.urlId, urlIds);

    const [countryRows, timeRows, referrerRows, deviceRows, browserRows] = await Promise.all([
      // Countries (top 10)
      db
        .select({ country: clickEvents.country, clicks: sql<number>`count(*)::int` })
        .from(clickEvents)
        .where(and(inUrlIds, gte(clickEvents.clickedAt, thirtyDaysAgo)))
        .groupBy(clickEvents.country)
        .orderBy(desc(sql`count(*)`))
        .limit(10),

      // Time series (daily, last 30 days)
      db
        .select({
          date:   sql<string>`date_trunc('day', ${clickEvents.clickedAt})::date::text`,
          clicks: sql<number>`count(*)::int`,
        })
        .from(clickEvents)
        .where(and(inUrlIds, gte(clickEvents.clickedAt, thirtyDaysAgo)))
        .groupBy(sql`date_trunc('day', ${clickEvents.clickedAt})`)
        .orderBy(sql`date_trunc('day', ${clickEvents.clickedAt})`),

      // Referrers (top 5)
      db
        .select({ referrer: clickEvents.referrer, clicks: sql<number>`count(*)::int` })
        .from(clickEvents)
        .where(and(inUrlIds, gte(clickEvents.clickedAt, thirtyDaysAgo)))
        .groupBy(clickEvents.referrer)
        .orderBy(desc(sql`count(*)`))
        .limit(5),

      // Devices
      db
        .select({ device: clickEvents.device, clicks: sql<number>`count(*)::int` })
        .from(clickEvents)
        .where(and(inUrlIds, gte(clickEvents.clickedAt, thirtyDaysAgo)))
        .groupBy(clickEvents.device)
        .orderBy(desc(sql`count(*)`)),

      // Browsers (top 6)
      db
        .select({ browser: clickEvents.browser, clicks: sql<number>`count(*)::int` })
        .from(clickEvents)
        .where(and(inUrlIds, gte(clickEvents.clickedAt, thirtyDaysAgo)))
        .groupBy(clickEvents.browser)
        .orderBy(desc(sql`count(*)`))
        .limit(6),
    ]);

    return {
      success: true,
      data: {
        byCountry:  countryRows.map((r) => ({ country:  r.country  || 'Unknown', clicks: r.clicks })),
        timeSeries: timeRows.map((r)    => ({ date:     r.date,                  clicks: r.clicks })),
        byReferrer: referrerRows.map((r) => ({ referrer: r.referrer || 'Direct', clicks: r.clicks })),
        byDevice:   deviceRows.map((r)  => ({ device:   r.device   || 'Unknown', clicks: r.clicks })),
        byBrowser:  browserRows.map((r) => ({ browser:  r.browser  || 'Other',   clicks: r.clicks })),
      },
    };
  } catch (error) {
    console.error('Error getting click analytics:', error);
    return { success: false, error: 'Failed to load analytics' };
  }
}
