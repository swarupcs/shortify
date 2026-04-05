import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/admin/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/sitemap.xml`,
  };
}
