'use server';

import { ApiResponse } from '@/lib/types';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { urls } from '@/server/db/schema';
import { revalidatePath } from 'next/cache';
import { writeAuditLog } from '../audit-log';
import { inArray } from 'drizzle-orm';

export async function bulkManageFlaggedUrls(
  urlIds: number[],
  action: 'approve' | 'delete',
): Promise<ApiResponse<{ processed: number }>> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    if (session.user.role !== 'admin') return { success: false, error: 'Unauthorized' };
    if (urlIds.length === 0) return { success: false, error: 'No URLs selected' };

    if (action === 'approve') {
      await db
        .update(urls)
        .set({ flagged: false, flagReason: null, updatedAt: new Date() })
        .where(inArray(urls.id, urlIds));
    } else {
      await db.delete(urls).where(inArray(urls.id, urlIds));
    }

    // Audit log — fire and forget
    writeAuditLog({
      actorId: session.user.id,
      action: action === 'approve' ? 'URL_APPROVED' : 'URL_DELETED',
      targetType: 'url',
      targetId: urlIds.join(','),
      metadata: { count: urlIds.length, bulk: true },
    });

    revalidatePath('/admin/urls');
    revalidatePath('/admin/urls/flagged');

    return { success: true, data: { processed: urlIds.length } };
  } catch (error) {
    console.error('Error bulk managing flagged URLs:', error);
    return { success: false, error: 'Failed to process URLs' };
  }
}
