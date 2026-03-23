'use server';

import { ApiResponse } from '@/lib/types';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { urls, users } from '@/server/db/schema';
import { and, asc, count, desc, ilike, or, eq, sql } from 'drizzle-orm';

export type UrlWithUser = {
  id: number;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clicks: number;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  flagged: boolean;
  flagReason: string | null;
};

type SortableColumn =
  | 'originalUrl'
  | 'shortCode'
  | 'createdAt'
  | 'clicks'
  | 'userName';
type FilterOption = 'all' | 'flagged' | 'security' | 'inappropriate' | 'other';

type GetAllUrlsOptions = {
  page?: number;
  limit?: number;
  sortBy?: SortableColumn;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filter?: FilterOption;
};

// ---------------------------------------------------------------------------
// Helper: build the WHERE clause for the flagReason-based sub-filters
// ---------------------------------------------------------------------------
function buildWhereClause(filter: FilterOption, search: string) {
  const conditions = [];

  // ── Flag filter ──────────────────────────────────────────────────────────
  if (filter === 'flagged') {
    conditions.push(eq(urls.flagged, true));
  } else if (filter === 'security') {
    conditions.push(eq(urls.flagged, true));
    conditions.push(
      or(
        ilike(urls.flagReason, '%security%'),
        ilike(urls.flagReason, '%phishing%'),
        ilike(urls.flagReason, '%malware%'),
      )!,
    );
  } else if (filter === 'inappropriate') {
    conditions.push(eq(urls.flagged, true));
    conditions.push(
      or(
        ilike(urls.flagReason, '%inappropriate%'),
        ilike(urls.flagReason, '%adult%'),
        ilike(urls.flagReason, '%offensive%'),
      )!,
    );
  } else if (filter === 'other') {
    conditions.push(eq(urls.flagged, true));
    // Flagged but NOT matching security or inappropriate keywords
    conditions.push(
      sql`NOT (
        ${urls.flagReason} ILIKE '%security%'
        OR ${urls.flagReason} ILIKE '%phishing%'
        OR ${urls.flagReason} ILIKE '%malware%'
        OR ${urls.flagReason} ILIKE '%inappropriate%'
        OR ${urls.flagReason} ILIKE '%adult%'
        OR ${urls.flagReason} ILIKE '%offensive%'
      )`,
    );
  }

  // ── Search filter ────────────────────────────────────────────────────────
  if (search.trim()) {
    conditions.push(
      or(
        ilike(urls.originalUrl, `%${search}%`),
        ilike(urls.shortCode, `%${search}%`),
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(urls.flagReason, `%${search}%`),
      )!,
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

// ---------------------------------------------------------------------------
// Helper: map sortBy string to a Drizzle order expression
// ---------------------------------------------------------------------------
function buildOrderBy(sortBy: SortableColumn, sortOrder: 'asc' | 'desc') {
  const dir = sortOrder === 'asc' ? asc : desc;

  switch (sortBy) {
    case 'originalUrl':
      return dir(urls.originalUrl);
    case 'shortCode':
      return dir(urls.shortCode);
    case 'clicks':
      return dir(urls.clicks);
    case 'userName':
      // Sort by name; fall back to email for anonymous rows
      return dir(sql`COALESCE(${users.name}, ${users.email}, '')`);
    case 'createdAt':
    default:
      return dir(urls.createdAt);
  }
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------
export async function getAllUrls(
  options: GetAllUrlsOptions = {},
): Promise<ApiResponse<{ urls: UrlWithUser[]; total: number }>> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    if (session.user.role !== 'admin')
      return { success: false, error: 'Unauthorized' };

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
      filter = 'all',
    } = options;

    const offset = (page - 1) * limit;
    const where = buildWhereClause(filter, search);
    const orderBy = buildOrderBy(sortBy, sortOrder);

    // ── Run count + data queries in parallel ─────────────────────────────
    const [totalResult, rows] = await Promise.all([
      // COUNT — no limit/offset needed
      db
        .select({ total: count() })
        .from(urls)
        .leftJoin(users, eq(urls.userId, users.id))
        .where(where),

      // DATA — with pagination
      db
        .select({
          id: urls.id,
          originalUrl: urls.originalUrl,
          shortCode: urls.shortCode,
          createdAt: urls.createdAt,
          clicks: urls.clicks,
          userId: urls.userId,
          userName: users.name,
          userEmail: users.email,
          flagged: urls.flagged,
          flagReason: urls.flagReason,
        })
        .from(urls)
        .leftJoin(users, eq(urls.userId, users.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
    ]);

    return {
      success: true,
      data: {
        urls: rows as UrlWithUser[],
        total: totalResult[0]?.total ?? 0,
      },
    };
  } catch (error) {
    console.error('Error getting all URLs:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}
