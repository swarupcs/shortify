'use server';

import { db } from '@/server/db';
import { passwordResetTokens, users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function forgotPassword(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // ── Rate limit: 3 reset requests per hour per IP ───────────────────
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headersList.get('x-real-ip') ??
      'unknown';

    const limitResult = await rateLimit(`forgot-password:ip:${ip}`, 3);
    if (!limitResult.allowed) {
      return {
        success: false,
        error: `Too many requests. Try again in ${Math.ceil(limitResult.retryAfterSeconds / 60)} minute(s).`,
      };
    }

    // ── Always return success to prevent email enumeration ─────────────
    // We do the real work below but never tell the caller if the email
    // exists or not.
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    if (!user || !user.password) {
      // No credentials account — silently succeed (OAuth-only user or
      // non-existent email). Don't leak which case it is.
      return { success: true };
    }

    // Invalidate any existing unused reset tokens for this user
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    // Generate token — 1 hour expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Send email — fire and forget the result so timing doesn't leak
    sendPasswordResetEmail(user.email, token).catch(() => {});

    return { success: true };
  } catch (error) {
    console.error('[forgot-password] Error:', error);
    // Still return success to prevent enumeration
    return { success: true };
  }
}
