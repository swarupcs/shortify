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

    // ── Check expiry ──────────────────────────────────────────────────
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

    // ── Check password protection ─────────────────────────────────────
    if (url.passwordHash) {
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

    // ── Increment click count (always — flagged or not) ───────────────
    await db
      .update(urls)
      .set({ clicks: url.clicks + 1, updatedAt: new Date() })
      .where(eq(urls.shortCode, shortCode));

    // ── Record per-click event (non-blocking) ─────────────────────────
    const headersList = await headers();
    const country =
      headersList.get('x-vercel-ip-country') ||
      headersList.get('cf-ipcountry') ||
      null;
    const referrer = parseReferrer(headersList.get('referer'));

    db.insert(clickEvents)
      .values({
        urlId: url.id,
        country: country ? country.substring(0, 2) : null,
        referrer: referrer ? referrer.substring(0, 255) : null,
      })
      .catch(() => {});

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
