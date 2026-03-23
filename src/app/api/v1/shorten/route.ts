import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/server/actions/api-keys/api-key-actions';
import { db } from '@/server/db';
import { urls } from '@/server/db/schema';
import { checkUrlSafety } from '@/server/actions/urls/check-url-safety';
import { rateLimit, ipFromHeaders } from '@/lib/rate-limit';
import { nanoid } from 'nanoid';
import { z } from 'zod';

/**
 * Deprecation notice date — update when v2 launches.
 * Format: RFC 7231 HTTP-date  e.g. "Sat, 01 Jan 2027 00:00:00 GMT"
 */
const DEPRECATION_DATE   = 'Sat, 01 Jan 2027 00:00:00 GMT';
const SUNSET_DATE        = 'Sat, 01 Jul 2027 00:00:00 GMT';
const APP_URL            = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com';

/** Attach deprecation headers to any v1 response */
function withDeprecationHeaders(response: NextResponse): NextResponse {
  response.headers.set('Deprecation',    DEPRECATION_DATE);
  response.headers.set('Sunset',         SUNSET_DATE);
  response.headers.set('Link',           `<${APP_URL}/api/v2/shorten>; rel="successor-version"`);
  response.headers.set('Warning',        '299 - "This API version is deprecated. Migrate to /api/v2/shorten."');
  return response;
}

const requestSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  customCode: z
    .string().max(20).regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  expiresAt: z
    .string().optional()
    .transform((val) => {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    }),
});

export async function POST(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return withDeprecationHeaders(
      NextResponse.json({ error: 'Unauthorized — provide Authorization: Bearer <api_key>' }, { status: 401 }),
    );
  }

  const rawKey = authHeader.slice(7);
  const userId = await validateApiKey(rawKey);
  if (!userId) {
    return withDeprecationHeaders(
      NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 }),
    );
  }

  // ── Rate limiting ─────────────────────────────────────────────────────
  const rateLimitResult = await rateLimit(`api:user:${userId}`, 100);
  if (!rateLimitResult.allowed) {
    return withDeprecationHeaders(
      NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfterSeconds },
        {
          status: 429,
          headers: {
            'Retry-After':          String(rateLimitResult.retryAfterSeconds),
            'X-RateLimit-Limit':    '100',
            'X-RateLimit-Remaining': '0',
          },
        },
      ),
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────
  let body: unknown;
  try { body = await request.json(); }
  catch { return withDeprecationHeaders(NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })); }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return withDeprecationHeaders(
      NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 422 }),
    );
  }

  const { url: originalUrl, customCode, expiresAt } = parsed.data;

  // ── Safety check ──────────────────────────────────────────────────────
  const safetyCheck = await checkUrlSafety(originalUrl);
  let flagged    = false;
  let flagReason: string | null = null;

  if (safetyCheck.success && safetyCheck.data) {
    flagged    = safetyCheck.data.flagged;
    flagReason = safetyCheck.data.reason ?? null;
    if (safetyCheck.data.category === 'malicious' && safetyCheck.data.confidence > 0.7) {
      return withDeprecationHeaders(
        NextResponse.json({ error: 'URL flagged as malicious and cannot be shortened' }, { status: 422 }),
      );
    }
  }

  // ── Check custom code ─────────────────────────────────────────────────
  const shortCode = customCode || nanoid(6);
  if (customCode) {
    const existing = await db.query.urls.findFirst({
      where: (urls, { eq }) => eq(urls.shortCode, customCode),
    });
    if (existing) {
      return withDeprecationHeaders(
        NextResponse.json({ error: 'Custom code is already taken' }, { status: 409 }),
      );
    }
  }

  // ── Insert ────────────────────────────────────────────────────────────
  await db.insert(urls).values({
    originalUrl,
    shortCode,
    userId,
    flagged,
    flagReason,
    expiresAt: expiresAt ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return withDeprecationHeaders(
    NextResponse.json(
      {
        shortUrl:  `${baseUrl}/r/${shortCode}`,
        shortCode,
        flagged,
        ...(flagReason ? { flagReason } : {}),
      },
      {
        headers: {
          'X-RateLimit-Limit':     '100',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        },
      },
    ),
  );
}

export async function GET() {
  return withDeprecationHeaders(
    NextResponse.json({
      name:       'Shortify API v1 (deprecated)',
      deprecated: true,
      sunset:     SUNSET_DATE,
      migrate:    `${APP_URL}/api/v2/shorten`,
      endpoints: {
        'POST /api/v1/shorten': {
          description: 'Shorten a URL',
          deprecated:  true,
          auth:        'Authorization: Bearer <api_key>',
          rateLimit:   '100 requests/hour per API key',
          body: {
            url:        'string (required)',
            customCode: 'string (optional)',
            expiresAt:  'string (optional) — ISO date e.g. 2025-12-31',
          },
        },
      },
    }),
  );
}
