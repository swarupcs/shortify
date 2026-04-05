'use server';

import { ApiResponse } from '@/lib/types';
import { db, eq } from '@/server/db';
import { urls, clickEvents } from '@/server/db/schema';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { parseUserAgent } from '@/lib/user-agent';
import { sql } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';
import { parseReferrer } from '@/lib/utils';

export async function verifyUrlPassword(
  shortCode: string,
  attempt: string,
): Promise<ApiResponse<{ originalUrl: string; flagged: boolean; flagReason: string | null }>> {
  try {
    const rateLimitResult = await rateLimit(`url-pwd:${shortCode}`, 10, 15 * 60 * 1000);
    if (!rateLimitResult.allowed) {
      return { success: false, error: 'Too many attempts. Please try again later.' };
    }
    const url = await db.query.urls.findFirst({
      where: (urls, { eq }) => eq(urls.shortCode, shortCode),
    });

    if (!url)               return { success: false, error: 'URL not found' };
    if (!url.passwordHash)  return { success: false, error: 'URL is not password protected' };

    const ok = await bcrypt.compare(attempt, url.passwordHash);
    if (!ok) return { success: false, error: 'Incorrect password' };

    // Set access cookie (1 hour)
    const cookieStore = await cookies();
    cookieStore.set(`shortlink_access_${shortCode}`, '1', {
      httpOnly: true,
      maxAge:   60 * 60,
      path:     `/r/${shortCode}`,
      sameSite: 'lax',
    });

    // Increment click count
    await db
      .update(urls)
      .set({ clicks: sql`${urls.clicks} + 1`, updatedAt: new Date() })
      .where(eq(urls.shortCode, shortCode));

    // Record click event with device + browser
    const headersList = await headers();
    const country =
      headersList.get('x-vercel-ip-country') ||
      headersList.get('cf-ipcountry') ||
      null;
    const referrer = parseReferrer(headersList.get('referer'));
    const { device, browser } = parseUserAgent(headersList.get('user-agent'));

    db.insert(clickEvents)
      .values({
        urlId:    url.id,
        country:  country  ? country.substring(0, 2)   : null,
        referrer: referrer ? referrer.substring(0, 255) : null,
        device,
        browser,
      })
      .catch(() => {});

    return {
      success: true,
      data: {
        originalUrl: url.originalUrl,
        flagged:     url.flagged   || false,
        flagReason:  url.flagReason || null,
      },
    };
  } catch (error) {
    console.error('Error verifying URL password:', error);
    return { success: false, error: 'An error occurred' };
  }
}
