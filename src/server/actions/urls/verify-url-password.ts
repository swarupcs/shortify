'use server';

import { ApiResponse } from '@/lib/types';
import { db } from '@/server/db';
import { urls, clickEvents } from '@/server/db/schema';
import { eq } from '@/server/db';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';

function parseReferrer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return url.hostname || null;
  } catch {
    return null;
  }
}

export async function verifyUrlPassword(
  shortCode: string,
  attempt: string,
): Promise<ApiResponse<{ originalUrl: string; flagged: boolean; flagReason: string | null }>> {
  try {
    const url = await db.query.urls.findFirst({
      where: (urls, { eq }) => eq(urls.shortCode, shortCode),
    });

    if (!url) return { success: false, error: 'URL not found' };
    if (!url.passwordHash) return { success: false, error: 'URL is not password protected' };

    const ok = await bcrypt.compare(attempt, url.passwordHash);
    if (!ok) return { success: false, error: 'Incorrect password' };

    // Password correct — set cookie so user isn't re-prompted for 1 hour
    const cookieStore = await cookies();
    cookieStore.set(`shortlink_access_${shortCode}`, '1', {
      httpOnly: true,
      maxAge: 60 * 60, // 1 hour
      path: `/r/${shortCode}`,
      sameSite: 'lax',
    });

    // Increment click count
    await db
      .update(urls)
      .set({ clicks: url.clicks + 1, updatedAt: new Date() })
      .where(eq(urls.shortCode, shortCode));

    // Record click event (non-blocking)
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
      },
    };
  } catch (error) {
    console.error('Error verifying URL password:', error);
    return { success: false, error: 'An error occurred' };
  }
}
