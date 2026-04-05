'use server';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { clickEvents, urls } from '@/server/db/schema';
import { and, desc, eq, gte, sql, inArray } from 'drizzle-orm';
import { subDays, format } from 'date-fns';

type ExportType = 'summary' | 'per-link' | 'raw';

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(headers: string[], rows: (string | number | null)[][]): string {
  const headerRow = headers.map(escapeCsv).join(',');
  const dataRows  = rows.map((row) => row.map(escapeCsv).join(','));
  return [headerRow, ...dataRows].join('\n');
}

export async function exportAnalytics(type: ExportType): Promise<{
  success: boolean;
  csv?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const userId        = session.user.id;
    const thirtyDaysAgo = subDays(new Date(), 30);
    const dateStr       = format(new Date(), 'yyyy-MM-dd');

    // ── 1. All links summary ───────────────────────────────────────────
    if (type === 'summary') {
      const rows = await db
        .select({
          shortCode:   urls.shortCode,
          originalUrl: urls.originalUrl,
          clicks:      urls.clicks,
          createdAt:   urls.createdAt,
          flagged:     urls.flagged,
          expiresAt:   urls.expiresAt,
          passwordProtected: sql<boolean>`(${urls.passwordHash} IS NOT NULL)`,
        })
        .from(urls)
        .where(and(eq(urls.userId, userId), sql`${urls.deletedAt} IS NULL`))
        .orderBy(desc(urls.clicks));

      const csv = buildCsv(
        ['Short Code', 'Original URL', 'Total Clicks', 'Created At', 'Flagged', 'Expires At', 'Password Protected'],
        rows.map((r) => [
          r.shortCode,
          r.originalUrl,
          r.clicks,
          format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm:ss'),
          r.flagged ? 'Yes' : 'No',
          r.expiresAt ? format(new Date(r.expiresAt), 'yyyy-MM-dd') : '',
          r.passwordProtected ? 'Yes' : 'No',
        ]),
      );

      return { success: true, csv, filename: `shortify-links-summary-${dateStr}.csv` };
    }

    // ── 2. Per-link detail ─────────────────────────────────────────────
    if (type === 'per-link') {
      const userUrls = await db
        .select({ id: urls.id, shortCode: urls.shortCode, originalUrl: urls.originalUrl, clicks: urls.clicks })
        .from(urls)
        .where(and(eq(urls.userId, userId), sql`${urls.deletedAt} IS NULL`))
        .orderBy(desc(urls.clicks));

      if (userUrls.length === 0) {
        return { success: true, csv: 'Short Code,Original URL,Total Clicks,Clicks Last 30 Days', filename: `shortify-per-link-${dateStr}.csv` };
      }

      const urlIds   = userUrls.map((u) => u.id);
      const inUrlIds = inArray(clickEvents.urlId, urlIds);

      // Clicks per URL in last 30 days
      const recentCounts = await db
        .select({ urlId: clickEvents.urlId, clicks: sql<number>`count(*)::int` })
        .from(clickEvents)
        .where(and(inUrlIds, gte(clickEvents.clickedAt, thirtyDaysAgo)))
        .groupBy(clickEvents.urlId);

      const recentMap = new Map(recentCounts.map((r) => [r.urlId, r.clicks]));

      const csv = buildCsv(
        ['Short Code', 'Original URL', 'Total Clicks', 'Clicks Last 30 Days'],
        userUrls.map((u) => [
          u.shortCode,
          u.originalUrl,
          u.clicks,
          recentMap.get(u.id) ?? 0,
        ]),
      );

      return { success: true, csv, filename: `shortify-per-link-${dateStr}.csv` };
    }

    // ── 3. Raw click events ────────────────────────────────────────────
    if (type === 'raw') {
      const userUrls = await db.query.urls.findMany({
        where: (urls, { eq, and, isNull }) => and(eq(urls.userId, userId), isNull(urls.deletedAt)),
        columns: { id: true, shortCode: true },
      });

      if (userUrls.length === 0) {
        return {
          success: true,
          csv: 'Short Code,Clicked At,Country,Referrer,Device,Browser',
          filename: `shortify-click-events-${dateStr}.csv`,
        };
      }

      const urlIds   = userUrls.map((u) => u.id);
      const shortMap = new Map(userUrls.map((u) => [u.id, u.shortCode]));
      const inUrlIds = inArray(clickEvents.urlId, urlIds);

      // Last 30 days raw events — cap at 10k rows for safety
      const events = await db
        .select({
          urlId:     clickEvents.urlId,
          clickedAt: clickEvents.clickedAt,
          country:   clickEvents.country,
          referrer:  clickEvents.referrer,
          device:    clickEvents.device,
          browser:   clickEvents.browser,
        })
        .from(clickEvents)
        .where(and(inUrlIds, gte(clickEvents.clickedAt, thirtyDaysAgo)))
        .orderBy(desc(clickEvents.clickedAt))
        .limit(10_000);

      const csv = buildCsv(
        ['Short Code', 'Clicked At', 'Country', 'Referrer', 'Device', 'Browser'],
        events.map((e) => [
          shortMap.get(e.urlId) ?? '',
          format(new Date(e.clickedAt), 'yyyy-MM-dd HH:mm:ss'),
          e.country  || '',
          e.referrer || '',
          e.device   || '',
          e.browser  || '',
        ]),
      );

      return { success: true, csv, filename: `shortify-click-events-${dateStr}.csv` };
    }

    return { success: false, error: 'Invalid export type' };
  } catch (error) {
    console.error('[export-analytics] Error:', error);
    return { success: false, error: 'Failed to generate export' };
  }
}
