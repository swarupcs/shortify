'use server';

import { ApiResponse } from '@/lib/types';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { urls } from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export type UserUrl = {
  id: number;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clicks: number;
  flagged: boolean;
  expiresAt: Date | null;
  passwordHash: string | null;
};

export async function getUserUrls(
  userId: string,
): Promise<ApiResponse<UserUrl[]>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const rows = await db
      .select({
        id: urls.id,
        originalUrl: urls.originalUrl,
        shortCode: urls.shortCode,
        createdAt: urls.createdAt,
        clicks: urls.clicks,
        flagged: urls.flagged,
        expiresAt: urls.expiresAt,
        passwordHash: urls.passwordHash,
      })
      .from(urls)
      .where(eq(urls.userId, userId))
      .orderBy(desc(urls.createdAt));

    return {
      success: true,
      data: rows.map((row) => ({
        ...row,
        expiresAt: row.expiresAt ?? null,
        passwordHash: row.passwordHash ?? null,
      })),
    };
  } catch (error) {
    console.error('Error getting user URLs', error);
    return { success: false, error: 'An error occurred' };
  }
}
