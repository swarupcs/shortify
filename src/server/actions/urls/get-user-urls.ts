'use server';

import { ApiResponse } from '@/lib/types';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { urls } from '@/server/db/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';

export type UserUrl = {
  id: number;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clicks: number;
  flagged: boolean;
  expiresAt: Date | null;
  passwordProtected: boolean;
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
        id:           urls.id,
        originalUrl:  urls.originalUrl,
        shortCode:    urls.shortCode,
        createdAt:    urls.createdAt,
        clicks:       urls.clicks,
        flagged:      urls.flagged,
        expiresAt:    urls.expiresAt,
        passwordHash: urls.passwordHash,
      })
      .from(urls)
      .where(
        and(
          eq(urls.userId, userId),
          isNull(urls.deletedAt), // exclude soft-deleted
        ),
      )
      .orderBy(desc(urls.createdAt));

    return {
      success: true,
      data: rows.map((row) => ({
        id:           row.id,
        originalUrl:  row.originalUrl,
        shortCode:    row.shortCode,
        createdAt:    row.createdAt,
        clicks:       row.clicks,
        flagged:      row.flagged,
        expiresAt:    row.expiresAt    ?? null,
        passwordProtected: !!row.passwordHash,
      })),
    };
  } catch (error) {
    console.error('Error getting user URLs', error);
    return { success: false, error: 'An error occurred' };
  }
}
