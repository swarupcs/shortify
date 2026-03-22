'use server';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { auditLogs, users } from '@/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export type AuditAction =
  | 'URL_APPROVED'
  | 'URL_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'DATABASE_SEEDED';

export type AuditLogEntry = {
  id: number;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorImage: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

/** Write an audit log entry — fire and forget, never throws */
export async function writeAuditLog(params: {
  actorId: string;
  action: AuditAction;
  targetType: 'url' | 'user' | 'database';
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata ?? {},
      createdAt: new Date(),
    });
  } catch (error) {
    // Never throw — audit logging should never break the main flow
    console.error('[audit] Failed to write audit log:', error);
  }
}

/** Read paginated audit logs for the /admin/audit page */
export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  filter?: 'all' | 'url' | 'user';
}): Promise<{
  success: boolean;
  data?: { logs: AuditLogEntry[]; total: number };
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    if (session.user.role !== 'admin') return { success: false, error: 'Unauthorized' };

    const { page = 1, limit = 20, filter = 'all' } = params;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause =
      filter === 'url'
        ? sql`${auditLogs.targetType} = 'url'`
        : filter === 'user'
          ? sql`${auditLogs.targetType} = 'user'`
          : undefined;

    // Get total count
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(whereClause);

    // Get paginated logs joined with actor user info
    const rows = await db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorName: users.name,
        actorEmail: users.email,
        actorImage: users.image,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        logs: rows as AuditLogEntry[],
        total,
      },
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return { success: false, error: 'Failed to load audit logs' };
  }
}
