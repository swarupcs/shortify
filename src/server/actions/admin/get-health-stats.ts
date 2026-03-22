'use server';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { urls, users, counters } from '@/server/db/schema';
import { sql, eq } from 'drizzle-orm';

export type HealthStatus = 'ok' | 'warn' | 'error';

export type HealthCheck = {
  label: string;
  status: HealthStatus;
  value: string;
  detail?: string;
};

export type HealthStats = {
  checks: HealthCheck[];
  dbLatencyMs: number;
  totalRedirects: number;
  aiScansToday: number;
  aiScanLimit: number;
};

export async function getHealthStats(): Promise<{
  success: boolean;
  data?: HealthStats;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    if (session.user.role !== 'admin') return { success: false, error: 'Unauthorized' };

    const checks: HealthCheck[] = [];

    // ── DB connectivity + latency ──────────────────────────────────────
    let dbLatencyMs = 0;
    try {
      const start = Date.now();
      await db.execute(sql`SELECT 1`);
      dbLatencyMs = Date.now() - start;
      checks.push({
        label: 'Database',
        status: dbLatencyMs < 200 ? 'ok' : dbLatencyMs < 1000 ? 'warn' : 'error',
        value: `${dbLatencyMs}ms`,
        detail: 'PostgreSQL connection',
      });
    } catch {
      checks.push({ label: 'Database', status: 'error', value: 'Unreachable', detail: 'Cannot connect to PostgreSQL' });
    }

    // ── Env vars ───────────────────────────────────────────────────────
    const requiredEnvVars = [
      { key: 'DATABASE_URL', label: 'Database URL' },
      { key: 'AUTH_SECRET', label: 'Auth secret' },
      { key: 'GOOGLE_GEMINI_API_KEY', label: 'Gemini API key' },
    ];
    for (const { key, label } of requiredEnvVars) {
      const isSet = !!process.env[key];
      checks.push({
        label,
        status: isSet ? 'ok' : 'error',
        value: isSet ? 'Set' : 'Missing',
        detail: isSet ? undefined : `${key} is not set in environment`,
      });
    }

    // ── Total redirects (sum of all clicks) ────────────────────────────
    const [{ total }] = await db
      .select({ total: sql<number>`coalesce(sum(${urls.clicks}), 0)` })
      .from(urls);
    const totalRedirects = Number(total ?? 0);

    // ── Total users ────────────────────────────────────────────────────
    const [{ userCount }] = await db
      .select({ userCount: sql<number>`count(*)::int` })
      .from(users);
    checks.push({
      label: 'Total users',
      status: 'ok',
      value: String(userCount ?? 0),
    });

    // ── AI scan usage ──────────────────────────────────────────────────
    const aiScanLimit = Number(process.env.GEMINI_DAILY_LIMIT ?? 1500);
    let aiScansToday = 0;
    try {
      const counter = await db.query.counters.findFirst({
        where: eq(counters.key, 'ai_scans_today'),
      });
      aiScansToday = counter?.value ?? 0;
    } catch {
      // counters table may not exist yet — safe to ignore
    }

    const scanPct = Math.round((aiScansToday / aiScanLimit) * 100);
    checks.push({
      label: 'AI scans today',
      status: scanPct < 80 ? 'ok' : scanPct < 95 ? 'warn' : 'error',
      value: `${aiScansToday} / ${aiScanLimit}`,
      detail: `${scanPct}% of daily limit used`,
    });

    return {
      success: true,
      data: {
        checks,
        dbLatencyMs,
        totalRedirects,
        aiScansToday,
        aiScanLimit,
      },
    };
  } catch (error) {
    console.error('Error getting health stats:', error);
    return { success: false, error: 'Failed to load health stats' };
  }
}
