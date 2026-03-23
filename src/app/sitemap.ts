import { MetadataRoute } from 'next';
import { db } from '@/server/db';
import { bioPages } from '@/server/db/schema';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:              APP_URL,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         1,
    },
    {
      url:              `${APP_URL}/stats`,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         0.8,
    },
    {
      url:              `${APP_URL}/login`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.5,
    },
    {
      url:              `${APP_URL}/register`,
      lastModified:     new Date(),
      changeFrequency:  'yearly',
      priority:         0.5,
    },
  ];

  // Dynamic: public bio pages
  let bioEntries: MetadataRoute.Sitemap = [];
  try {
    const pages = await db
      .select({ handle: bioPages.handle, updatedAt: bioPages.updatedAt })
      .from(bioPages);

    bioEntries = pages.map((p) => ({
      url:             `${APP_URL}/bio/${p.handle}`,
      lastModified:    p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority:        0.6,
    }));
  } catch (error) {
    // Never break the build — bio pages are a bonus
    console.error('[sitemap] Failed to load bio pages:', error);
  }

  return [...staticPages, ...bioEntries];
}
