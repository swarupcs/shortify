'use server';

import { ApiResponse } from '@/lib/types';
import { db, eq } from '@/server/db';
import { urls, clickEvents } from '@/server/db/schema';
import { headers } from 'next/headers';

function parseReferrer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return url.hostname || null;
  } catch {
    return null;
  }
}

/**
 * Record a click increment + click event row.
 * Extracted so both the normal redirect path and the
 * password-protected cookie re-entry path share identical logic.
 */
async function recordClick(urlId: number, currentClicks: number, shortCode: string): Promise<void> {
  const headersList = await headers();
  const country =
    headersList.get('x-vercel-ip-country') ||
    headersList.get('cf-ipcountry') ||
    null;
  const referrer = parseReferrer(headersList.get('referer'));

  // Increment click count
  await db
    .update(urls)
    .set({ clicks: currentClicks + 1, updatedAt: new Date() })
    .where(eq(urls.shortCode, shortCode));

  // Record per-click event (non-blocking — never fails the redirect)
  db.insert(clickEvents)
    .values({
      urlId,
      country: country ? country.substring(0, 2) : null,
      referrer: referrer ? referrer.substring(0, 255) : null,
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
      where: (urls, { eq }) => eq(urls.shortCode, shortCode),
    });

    if (!url) return { success: false, error: 'URL not found' };

    // ── Expired ───────────────────────────────────────────────────────
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

    // ── Password protected ────────────────────────────────────────────
    if (url.passwordHash) {
      // Check if the caller already has a valid access cookie.
      // We import cookies() lazily here to avoid the cookies() call
      // on every non-protected redirect (it's slightly cheaper).
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const accessCookie = cookieStore.get(`shortlink_access_${shortCode}`);

      if (!accessCookie) {
        // No cookie — caller must enter the password
        return {
          success: true,
          data: {
            originalUrl: url.originalUrl,
            passwordProtected: true,
            flagged: url.flagged || false,
            flagReason: url.flagReason || null,
            expired: false,
          },
        };
      }

      // ── FIX: cookie re-entry now records the click ──────────────────
      // Previously this fell through to a bare redirect() without
      // incrementing clicks or recording the click event.
      await recordClick(url.id, url.clicks, shortCode);

      return {
        success: true,
        data: {
          originalUrl: url.originalUrl,
          passwordProtected: false, // cookie valid — treat as normal redirect
          flagged: url.flagged || false,
          flagReason: url.flagReason || null,
          expired: false,
        },
      };
    }

    // ── Normal redirect ───────────────────────────────────────────────
    await recordClick(url.id, url.clicks, shortCode);

    return {
      success: true,
      data: {
        originalUrl: url.originalUrl,
        flagged: url.flagged || false,
        flagReason: url.flagReason || null,
        expired: false,
        passwordProtected: false,
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'An error occurred while fetching the URL' };
  }
}
