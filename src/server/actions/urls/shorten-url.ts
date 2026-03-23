'use server';

import { ApiResponse } from '@/lib/types';
import { ensureHttps, isValidUrl } from '@/lib/utils';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { db } from '@/server/db';
import { urls, users } from '@/server/db/schema';
import { revalidatePath } from 'next/cache';
import { auth } from '@/server/auth';
import { checkUrlSafety } from './check-url-safety';
import { rateLimit } from '@/lib/rate-limit';
import { writeAuditLog } from '@/server/actions/admin/audit-log';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const shortenUrlSchema = z.object({
  url: z.string().refine(isValidUrl, { message: 'Please enter a valid URL' }),
  customCode: z
    .string().max(20).regex(/^[a-zA-Z0-9_-]+$/)
    .optional().nullable()
    .transform((val) => (val === null || val === '' ? undefined : val)),
  expiresAt: z
    .string().nullable().optional()
    .transform((val) => {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    }),
  password: z
    .string().min(1).max(100).nullable().optional()
    .transform((val) => (val === null || val === '' ? undefined : val)),
});

export async function shortenUrl(
  formData: FormData,
): Promise<ApiResponse<{ shortUrl: string; flagged: boolean; flagReason?: string | null; message?: string }>> {
  try {
    const session = await auth();
    const userId  = session?.user?.id;

    // ── Rate limiting ────────────────────────────────────────────────────
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headersList.get('x-real-ip') ??
      'unknown';

    if (userId) {
      const result = await rateLimit(`shorten:user:${userId}`, 50);
      if (!result.allowed) {
        return { success: false, error: `Too many requests. Try again in ${Math.ceil(result.retryAfterSeconds / 60)} minute(s).` };
      }

      // ── Block unverified credential users ──────────────────────────────
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { emailVerified: true, password: true },
      });
      const isCredentialsUser = !!dbUser?.password;
      if (isCredentialsUser && !dbUser?.emailVerified) {
        return {
          success: false,
          error: 'Please verify your email address before shortening URLs. Check your inbox for a verification link.',
        };
      }
    } else {
      const result = await rateLimit(`shorten:ip:${ip}`, 10);
      if (!result.allowed) {
        return { success: false, error: `Too many requests. Try again in ${Math.ceil(result.retryAfterSeconds / 60)} minute(s).` };
      }
    }

    const url         = formData.get('url') as string;
    const customCode  = formData.get('customCode') as string;
    const expiresAtRaw = formData.get('expiresAt') as string | null;
    const password    = formData.get('password') as string | null;

    const validatedFields = shortenUrlSchema.safeParse({
      url,
      customCode:  customCode  || undefined,
      expiresAt:   expiresAtRaw || null,
      password:    password    || null,
    });

    if (!validatedFields.success) {
      return { success: false, error: validatedFields.error.flatten().fieldErrors.url?.[0] || 'Invalid URL' };
    }

    const originalUrl = ensureHttps(validatedFields.data.url);

    // AI safety check
    const safetyCheck = await checkUrlSafety(originalUrl);
    let flagged    = false;
    let flagReason = null;

    if (safetyCheck.success && safetyCheck.data) {
      flagged    = safetyCheck.data.flagged;
      flagReason = safetyCheck.data.reason;
      if (safetyCheck.data.category === 'malicious' && safetyCheck.data.confidence > 0.7 && session?.user?.role !== 'admin') {
        return { success: false, error: 'This URL is flagged as malicious' };
      }
    }

    let passwordHash: string | undefined;
    if (validatedFields.data.password) {
      passwordHash = await bcrypt.hash(validatedFields.data.password, 10);
    }

    const shortCode = validatedFields.data.customCode || nanoid(6);

    const existingUrl = await db.query.urls.findFirst({
      where: (urls, { eq }) => eq(urls.shortCode, shortCode),
    });

    if (existingUrl) {
      if (validatedFields.data.customCode) return { success: false, error: 'Custom code already exists' };
      return shortenUrl(formData);
    }

    const [inserted] = await db.insert(urls).values({
      originalUrl,
      shortCode,
      createdAt:    new Date(),
      updatedAt:    new Date(),
      userId:       userId || null,
      flagged,
      flagReason,
      expiresAt:    validatedFields.data.expiresAt || null,
      passwordHash: passwordHash || null,
    }).returning({ id: urls.id });

    // ── Audit log (authenticated users only) ────────────────────────────
    if (userId) {
      writeAuditLog({
        actorId:    userId,
        action:     'USER_URL_CREATED',
        targetType: 'url',
        targetId:   String(inserted.id),
        metadata:   {
          shortCode,
          originalUrl,
          flagged,
          passwordProtected: !!passwordHash,
          hasExpiry:         !!validatedFields.data.expiresAt,
        },
      });
    }

    const baseUrl  = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shortUrl = `${baseUrl}/r/${shortCode}`;
    revalidatePath('/');

    return {
      success: true,
      data: {
        shortUrl,
        flagged,
        flagReason,
        message: flagged ? 'This URL has been flagged for review by our safety system.' : undefined,
      },
    };
  } catch (error) {
    console.error('Failed to shorten URL', error);
    return { success: false, error: 'Failed to shorten URL' };
  }
}
