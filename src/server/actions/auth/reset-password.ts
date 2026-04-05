'use server';

import { db } from '@/server/db';
import { passwordResetTokens, users } from '@/server/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type ResetPasswordResult =
  | { status: 'success' }
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'validation_error'; message: string };

export async function resetPassword(
  token: string,
  password: string,
): Promise<ResetPasswordResult> {
  try {
    const parsed = schema.safeParse({ token, password });
    if (!parsed.success) {
      return {
        status: 'validation_error',
        message: parsed.error.issues[0]?.message ?? 'Invalid input',
      };
    }

    // Find token row — must be unused
    const row = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
      ),
    });

    if (!row) return { status: 'invalid' };
    if (row.expiresAt < new Date()) return { status: 'expired' };

    const passwordHash = await bcrypt.hash(password, 10);

    // Update password + mark token used — both atomically
    await Promise.all([
      db
        .update(users)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(users.id, row.userId)),

      db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, row.id)),
    ]);

    return { status: 'success' };
  } catch (error) {
    console.error('[reset-password] Error:', error);
    return { status: 'invalid' };
  }
}
