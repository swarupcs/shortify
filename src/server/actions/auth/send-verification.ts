'use server';

import { db } from '@/server/db';
import { emailVerificationTokens, users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendVerificationEmail } from '@/lib/email';
import { auth } from '@/server/auth';
import crypto from 'crypto';

/**
 * Send (or resend) a verification email for the currently logged-in user.
 * Safe to call multiple times — invalidates any existing unused tokens first.
 */
export async function sendVerification(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Not authenticated' };

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) return { success: false, error: 'User not found' };
    if (user.emailVerified) return { success: false, error: 'Email already verified' };

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Invalidate existing tokens for this user
    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, user.id));

    // Insert new token
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Send the email
    const result = await sendVerificationEmail(user.email, token);
    if (!result.success) return { success: false, error: result.error };

    return { success: true };
  } catch (error) {
    console.error('[verify] Failed to send verification:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
}
