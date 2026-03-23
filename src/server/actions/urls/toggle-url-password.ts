'use server';

import { ApiResponse } from '@/lib/types';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { urls } from '@/server/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  urlId:    z.number().int().positive(),
  // password = string → set protection
  // password = null   → remove protection
  password: z.string().min(1).max(100).nullable(),
});

export async function toggleUrlPassword(
  urlId: number,
  password: string | null,
): Promise<ApiResponse<{ passwordProtected: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const parsed = schema.safeParse({ urlId, password });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    // Verify ownership
    const url = await db.query.urls.findFirst({
      where: and(
        eq(urls.id, urlId),
        eq(urls.userId, session.user.id),
        isNull(urls.deletedAt),
      ),
    });

    if (!url) return { success: false, error: 'URL not found' };

    const passwordHash = password
      ? await bcrypt.hash(password, 10)
      : null;

    await db
      .update(urls)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(urls.id, urlId));

    revalidatePath('/dashboard');

    return {
      success: true,
      data: { passwordProtected: passwordHash !== null },
    };
  } catch (error) {
    console.error('[toggle-password] Error:', error);
    return { success: false, error: 'Failed to update password protection' };
  }
}
