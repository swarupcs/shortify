'use server';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { urls, users } from '@/server/db/schema';
import { count, sql, and, gte } from 'drizzle-orm';
import { subDays } from 'date-fns';

export type AdminStats = {
  totalUsers: number;
  totalUrls: number;
  totalClicks: number;
  flaggedUrls: number;
  newUsersThisWeek: number;
  newUrlsThisWeek: number;
  urlsPerDay: Array<{ date: string; count: number }>;
  usersPerDay: Array<{ date: string; count: number }>;
};

export async function getAdminStats(): Promise<{
  success: boolean;
  data?: AdminStats;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    if (session.user.role !== 'admin') return { success: false, error: 'Unauthorized' };

    const sevenDaysAgo = subDays(new Date(), 7);
    const fourteenDaysAgo = subDays(new Date(), 14);

    const [
      [totalUsersRow],
      [totalUrlsRow],
      [totalClicksRow],
      [flaggedRow],
      [newUsersRow],
      [newUrlsRow],
      urlsPerDayRows,
      usersPerDayRows,
    ] = await Promise.all([
      // Total users
      db.select({ value: count() }).from(users),
      // Total URLs
      db.select({ value: count() }).from(urls),
      // Total clicks
      db.select({ total: sql<number>`coalesce(sum(${urls.clicks}), 0)` }).from(urls),
      // Flagged URLs
      db.select({ value: count() }).from(urls).where(sql`${urls.flagged} = true`),
      // New users this week
      db.select({ value: count() }).from(users).where(gte(users.createdAt, sevenDaysAgo)),
      // New URLs this week
      db.select({ value: count() }).from(urls).where(gte(urls.createdAt, sevenDaysAgo)),
      // URLs per day last 14 days
      db
        .select({
          date: sql<string>`date_trunc('day', ${urls.createdAt})::date::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(urls)
        .where(gte(urls.createdAt, fourteenDaysAgo))
        .groupBy(sql`date_trunc('day', ${urls.createdAt})`)
        .orderBy(sql`date_trunc('day', ${urls.createdAt})`),
      // Users per day last 14 days
      db
        .select({
          date: sql<string>`date_trunc('day', ${users.createdAt})::date::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(users)
        .where(gte(users.createdAt, fourteenDaysAgo))
        .groupBy(sql`date_trunc('day', ${users.createdAt})`)
        .orderBy(sql`date_trunc('day', ${users.createdAt})`),
    ]);

    return {
      success: true,
      data: {
        totalUsers: totalUsersRow?.value ?? 0,
        totalUrls: totalUrlsRow?.value ?? 0,
        totalClicks: Number(totalClicksRow?.total ?? 0),
        flaggedUrls: flaggedRow?.value ?? 0,
        newUsersThisWeek: newUsersRow?.value ?? 0,
        newUrlsThisWeek: newUrlsRow?.value ?? 0,
        urlsPerDay: urlsPerDayRows.map((r) => ({ date: r.date, count: r.count })),
        usersPerDay: usersPerDayRows.map((r) => ({ date: r.date, count: r.count })),
      },
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return { success: false, error: 'Failed to load stats' };
  }
}
