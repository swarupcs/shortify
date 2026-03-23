'use server';

import { ApiResponse } from '@/lib/types';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { urls } from '@/server/db/schema';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { writeAuditLog } from '@/server/actions/admin/audit-log';

export async function bulkDeleteUrls(
  urlIds: number[],
): Promise<ApiResponse<{ deleted: number }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
    if (urlIds.length === 0)   return { success: false, error: 'No URLs selected' };
    if (urlIds.length > 100)   return { success: false, error: 'Maximum 100 URLs per batch' };

    const result = await db
      .update(urls)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(
        inArray(urls.id, urlIds),
        eq(urls.userId, session.user.id),
        isNull(urls.deletedAt),
      ))
      .returning({ id: urls.id });

    // Audit log
    writeAuditLog({
      actorId:    session.user.id,
      action:     'USER_URLS_BULK_DELETED',
      targetType: 'url',
      targetId:   urlIds.join(','),
      metadata:   { count: result.length, urlIds },
    });

    revalidatePath('/dashboard');
    return { success: true, data: { deleted: result.length } };
  } catch (error) {
    console.error('[bulk-delete] Error:', error);
    return { success: false, error: 'Failed to delete URLs' };
  }
}
