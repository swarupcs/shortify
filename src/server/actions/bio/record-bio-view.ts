'use server';

import { db } from '@/server/db';
import { bioPageViews, bioPages } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

/**
 * Record a single bio page view. Called from the public bio page on load.
 * Fire-and-forget — never throws, never blocks the page render.
 */
export async function recordBioView(handle: string): Promise<void> {
  try {
    const page = await db.query.bioPages.findFirst({
      where: eq(bioPages.handle, handle),
      columns: { id: true },
    });

    if (!page) return;

    const headersList = await headers();
    const country =
      headersList.get('x-vercel-ip-country') ||
      headersList.get('cf-ipcountry') ||
      null;

    await db.insert(bioPageViews).values({
      bioPageId: page.id,
      country:   country ? country.substring(0, 2) : null,
      viewedAt:  new Date(),
    });
  } catch (error) {
    // Never throw — view tracking must not break the page
    console.error('[bio-view] Failed to record view:', error);
  }
}
