import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/server/actions/api-keys/api-key-actions';
import { db } from '@/server/db';
import { urls } from '@/server/db/schema';
import { checkUrlSafety } from '@/server/actions/urls/check-url-safety';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const requestSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  customCode: z
    .string()
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  expiresAt: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    }),
});

/**
 * POST /api/v1/shorten
 *
 * Headers:
 *   Authorization: Bearer sk_live_<key>
 *   Content-Type: application/json
 *
 * Body:
 *   { "url": "https://example.com", "customCode"?: "my-code", "expiresAt"?: "2025-12-31" }
 *
 * Response 200:
 *   { "shortUrl": "https://yourdomain.com/r/abc123", "shortCode": "abc123", "flagged": false }
 *
 * Response 401: { "error": "Unauthorized" }
 * Response 422: { "error": "..." }
 * Response 429: { "error": "Custom code already taken" }
 */
export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized — provide Authorization: Bearer <api_key>' },
      { status: 401 },
    );
  }

  const rawKey = authHeader.slice(7);
  const userId = await validateApiKey(rawKey);

  if (!userId) {
    return NextResponse.json(
      { error: 'Invalid or revoked API key' },
      { status: 401 },
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid request' },
      { status: 422 },
    );
  }

  const { url: originalUrl, customCode, expiresAt } = parsed.data;

  // ── Safety check ──────────────────────────────────────────────────────
  const safetyCheck = await checkUrlSafety(originalUrl);
  let flagged = false;
  let flagReason: string | null = null;

  if (safetyCheck.success && safetyCheck.data) {
    flagged = safetyCheck.data.flagged;
    flagReason = safetyCheck.data.reason ?? null;
    if (
      safetyCheck.data.category === 'malicious' &&
      safetyCheck.data.confidence > 0.7
    ) {
      return NextResponse.json(
        { error: 'URL flagged as malicious and cannot be shortened' },
        { status: 422 },
      );
    }
  }

  // ── Check custom code availability ────────────────────────────────────
  const shortCode = customCode || nanoid(6);

  if (customCode) {
    const existing = await db.query.urls.findFirst({
      where: (urls, { eq }) => eq(urls.shortCode, customCode),
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Custom code is already taken' },
        { status: 409 },
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

  return NextResponse.json({
    shortUrl: `${baseUrl}/r/${shortCode}`,
    shortCode,
    flagged,
    ...(flagReason ? { flagReason } : {}),
  });
}

/**
 * GET /api/v1/shorten — returns API docs
 */
export async function GET() {
  return NextResponse.json({
    name: 'Shortify API v1',
    endpoints: {
      'POST /api/v1/shorten': {
        description: 'Shorten a URL',
        auth: 'Authorization: Bearer <api_key>',
        body: {
          url: 'string (required) — URL to shorten',
          customCode: 'string (optional) — custom short code',
          expiresAt: 'string (optional) — ISO date for expiry e.g. 2025-12-31',
        },
        response: {
          shortUrl: 'Full short URL',
          shortCode: 'The short code',
          flagged: 'boolean — true if flagged by AI safety',
        },
      },
    },
  });
}
