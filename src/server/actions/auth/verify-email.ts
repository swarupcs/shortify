'use server';

import { db } from '@/server/db';
import { emailVerificationTokens, users } from '@/server/db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';

export type VerifyEmailResult =
  | { status: 'success' }
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'already_verified' };

export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
  try {
    if (!token) return { status: 'invalid' };

    // Find the token row — must be unused and not expired
    const row = await db.query.emailVerificationTokens.findFirst({
      where: and(
        eq(emailVerificationTokens.token, token),
        isNull(emailVerificationTokens.usedAt),
      ),
    });

    if (!row) return { status: 'invalid' };
    if (row.expiresAt < new Date()) return { status: 'expired' };

    // Load the user
    const user = await db.query.users.findFirst({
      where: eq(users.id, row.userId),
    });

    if (!user) return { status: 'invalid' };
    if (user.emailVerified) return { status: 'already_verified' };

    // Mark user as verified + mark token as used — both in one go
    await Promise.all([
      db
        .update(users)
        .set({ emailVerified: new Date(), updatedAt: new Date() })
        .where(eq(users.id, user.id)),

      db
        .update(emailVerificationTokens)
        .set({ usedAt: new Date() })
        .where(eq(emailVerificationTokens.id, row.id)),
    ]);

    return { status: 'success' };
  } catch (error) {
    console.error('[verify] Error verifying email:', error);
    return { status: 'invalid' };
  }
}
