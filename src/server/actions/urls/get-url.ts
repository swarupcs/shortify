'use server';

import { ApiResponse } from '@/lib/types';
import { db, eq } from '@/server/db';
import { sql } from 'drizzle-orm';
import { urls, clickEvents } from '@/server/db/schema';
import { headers } from 'next/headers';
import { parseUserAgent } from '@/lib/user-agent';

function parseReferrer(referer: string | null): string | null {
  if (!referer) return null;
  try { return new URL(referer).hostname || null; }
  catch { return null; }
}

async function recordClick(urlId: number, currentClicks: number, shortCode: string): Promise<void> {
  const headersList = await headers();
  const country =
    headersList.get('x-vercel-ip-country') ||
    headersList.get('cf-ipcountry') ||
    null;
  const referrer  = parseReferrer(headersList.get('referer'));
  const { device, browser } = parseUserAgent(headersList.get('user-agent'));

  await db
    .update(urls)
    .set({ clicks: sql`${urls.clicks} + 1`, updatedAt: new Date() })
    .where(eq(urls.shortCode, shortCode));

  db.insert(clickEvents)
    .values({
      urlId,
      country:  country  ? country.substring(0, 2)   : null,
      referrer: referrer ? referrer.substring(0, 255) : null,
      device,
      browser,
    })
    .catch(() => {});
}

export async function getUrlByShortCode(shortCode: string): Promise<
  ApiResponse<{
    originalUrl: string;
    flagged?: boolean;
    flagReason?: string | null;
    expired?: boolean;
    expiresAt?: Date | null;
    passwordProtected?: boolean;
  }>
> {
  try {
    const url = await db.query.urls.findFirst({
      where: (urls, { eq, and, isNull }) =>
        and(eq(urls.shortCode, shortCode), isNull(urls.deletedAt)),
    });

    if (!url) return { success: false, error: 'URL not found' };

    // ── Expired ────────────────────────────────────────────────────────
    if (url.expiresAt && url.expiresAt < new Date()) {
      return {
        success: true,
        data: {
          originalUrl: url.originalUrl,
          expired: true,
          expiresAt: url.expiresAt,
          flagged: false,
          passwordProtected: false,
        },
      };
    }

    // ── Password protected ─────────────────────────────────────────────
    if (url.passwordHash) {
      const { cookies } = await import('next/headers');
      const cookieStore  = await cookies();
      const accessCookie = cookieStore.get(`shortlink_access_${shortCode}`);

      if (!accessCookie) {
        return {
          success: true,
          data: {
            originalUrl:      url.originalUrl,
            passwordProtected: true,
            flagged:           url.flagged   || false,
            flagReason:        url.flagReason || null,
            expired:           false,
          },
        };
      }

      // Cookie valid — record click and fall through to normal redirect
      await recordClick(url.id, url.clicks, shortCode);
      return {
        success: true,
        data: {
          originalUrl:      url.originalUrl,
          passwordProtected: false,
          flagged:           url.flagged   || false,
          flagReason:        url.flagReason || null,
          expired:           false,
        },
      };
    }

    // ── Normal redirect ────────────────────────────────────────────────
    await recordClick(url.id, url.clicks, shortCode);

    return {
      success: true,
      data: {
        originalUrl:      url.originalUrl,
        flagged:           url.flagged   || false,
        flagReason:        url.flagReason || null,
        expired:           false,
        passwordProtected: false,
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An error occurred while fetching the URL' };
  }
}
