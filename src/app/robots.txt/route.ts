import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com';

export function GET() {
  const content = `User-agent: *
Allow: /
Allow: /stats
Allow: /bio/

# Block admin and private routes
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/
Disallow: /r/

Sitemap: ${APP_URL}/sitemap.xml
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // 24h cache
    },
  });
}
