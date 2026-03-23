'use server';

import { ApiResponse } from '@/lib/types';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { and, asc, count, desc, ilike, or, sql } from 'drizzle-orm';

export type UserWithoutPassword = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  image: string | null;
};

type SortableColumn = 'name' | 'email' | 'role' | 'createdAt';

type GetAllUsersOptions = {
  page?: number;
  limit?: number;
  sortBy?: SortableColumn;
  sortOrder?: 'asc' | 'desc';
  search?: string;
};

// ---------------------------------------------------------------------------
// Helper: build ORDER BY expression
// ---------------------------------------------------------------------------
function buildOrderBy(sortBy: SortableColumn, sortOrder: 'asc' | 'desc') {
  const dir = sortOrder === 'asc' ? asc : desc;

  switch (sortBy) {
    case 'name':
      return dir(users.name);
    case 'email':
      return dir(users.email);
    case 'role':
      return dir(users.role);
    case 'createdAt':
    default:
      return dir(users.createdAt);
  }
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------
export async function getAllUsers(
  options: GetAllUsersOptions = {},
): Promise<ApiResponse<{ users: UserWithoutPassword[]; total: number }>> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Not authenticated' };
    if (session.user.role !== 'admin')
      return { success: false, error: 'Not authorized' };

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
    } = options;

    const offset = (page - 1) * limit;

    // ── WHERE clause ─────────────────────────────────────────────────────
    const where = search.trim()
      ? or(ilike(users.email, `%${search}%`), ilike(users.name, `%${search}%`))
      : undefined;

    const orderBy = buildOrderBy(sortBy, sortOrder);

    // ── Run count + data queries in parallel ─────────────────────────────
    const [totalResult, rows] = await Promise.all([
      db.select({ total: count() }).from(users).where(where),

      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          image: users.image,
        })
        .from(users)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
    ]);

    return {
      success: true,
      data: {
        users: rows as UserWithoutPassword[],
        total: totalResult[0]?.total ?? 0,
      },
    };
  } catch (error) {
    console.error('Error getting all users:', error);
    return { success: false, error: 'Error getting all users' };
  }
}
