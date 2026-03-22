'use server';

import { ApiResponse } from '@/lib/types';
import { auth } from '@/server/auth';
import { db } from '@/server/db';

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

    const userUrls = await db.query.urls.findMany({
      where: (urls, { eq }) => eq(urls.userId, userId),
      orderBy: (urls, { desc }) => [desc(urls.createdAt)],
    });

    return {
      success: true,
      data: userUrls.map((url) => ({
        id: url.id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        createdAt: url.createdAt,
        clicks: url.clicks,
        flagged: url.flagged,
        expiresAt: url.expiresAt ?? null,
        passwordHash: url.passwordHash ?? null,
      })),
    };
  } catch (error) {
    console.error('Error getting user URLs', error);
    return { success: false, error: 'An error occurred' };
  }
}
