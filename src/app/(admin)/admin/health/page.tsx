'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getHealthStats, type HealthStats, type HealthStatus } from '@/server/actions/admin/get-health-stats';
import { Activity, ArrowLeft, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const STATUS_ICON: Record<HealthStatus, React.ReactNode> = {
  ok: <CheckCircle2 className='size-4 text-emerald-500' />,
  warn: <AlertTriangle className='size-4 text-amber-500' />,
  error: <XCircle className='size-4 text-red-500' />,
};

const STATUS_DOT: Record<HealthStatus, string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  error: 'bg-red-500',
};

export default function HealthPage() {
  const router = useRouter();
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    const res = await getHealthStats();
    if (res.success && res.data) {
      setStats(res.data);
      setLastRefreshed(new Date());
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30s
    const interval = setInterval(() => fetchStats(), 30_000);
    return () => clearInterval(interval);
  }, []);

  const overallStatus: HealthStatus = stats
    ? stats.checks.some((c) => c.status === 'error')
      ? 'error'
      : stats.checks.some((c) => c.status === 'warn')
        ? 'warn'
        : 'ok'
    : 'ok';

  const overallLabel = { ok: 'All systems operational', warn: 'Some warnings detected', error: 'Issues detected' };

  return (
    <>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400'>
            <Activity className='size-5' />
          </div>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Health Monitor</h1>
            <p className='text-muted-foreground text-sm mt-0.5'>
              System status — auto-refreshes every 30s
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='gap-2'
            onClick={() => fetchStats(true)}
            disabled={refreshing}
          >
            {refreshing
              ? <Loader2 className='size-4 animate-spin' />
              : <RefreshCw className='size-4' />}
            Refresh
          </Button>
          <Link href='/admin'>
            <Button variant='outline' size='sm' className='gap-2'>
              <ArrowLeft className='size-4' />
              Back to Admin
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center items-center py-20'>
          <Loader2 className='size-8 animate-spin text-violet-600 dark:text-violet-400' />
        </div>
      ) : (
        <div className='grid gap-6'>
          {/* ── Overall status banner ── */}
          <div className={cn(
            'flex items-center gap-3 p-4 rounded-2xl border',
            overallStatus === 'ok' && 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
            overallStatus === 'warn' && 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
            overallStatus === 'error' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          )}>
            <div className={cn('size-3 rounded-full animate-pulse', STATUS_DOT[overallStatus])} />
            <div>
              <p className='font-medium text-sm'>{overallLabel[overallStatus]}</p>
              <p className='text-xs text-muted-foreground'>
                Last checked {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* ── Checks grid ── */}
          <Card className='shadow-sm border-border/60 rounded-2xl'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>System checks</CardTitle>
              <CardDescription className='text-xs'>Individual component status</CardDescription>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='divide-y divide-border/40'>
                {stats?.checks.map((check) => (
                  <div key={check.label} className='flex items-center justify-between px-4 py-3.5'>
                    <div className='flex items-center gap-3'>
                      {STATUS_ICON[check.status]}
                      <div>
                        <p className='text-sm font-medium'>{check.label}</p>
                        {check.detail && (
                          <p className='text-xs text-muted-foreground mt-0.5'>{check.detail}</p>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      'text-sm font-mono font-medium',
                      check.status === 'ok' && 'text-emerald-600 dark:text-emerald-400',
                      check.status === 'warn' && 'text-amber-600 dark:text-amber-400',
                      check.status === 'error' && 'text-red-600 dark:text-red-400',
                    )}>
                      {check.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Metric cards ── */}
          <div className='grid sm:grid-cols-3 gap-3'>
            <div className='p-4 rounded-2xl border border-border/60 bg-card'>
              <p className='text-xs text-muted-foreground mb-1'>DB latency</p>
              <p className={cn(
                'text-2xl font-bold',
                (stats?.dbLatencyMs ?? 0) < 200 && 'text-emerald-600 dark:text-emerald-400',
                (stats?.dbLatencyMs ?? 0) >= 200 && (stats?.dbLatencyMs ?? 0) < 1000 && 'text-amber-600 dark:text-amber-400',
                (stats?.dbLatencyMs ?? 0) >= 1000 && 'text-red-600 dark:text-red-400',
              )}>
                {stats?.dbLatencyMs ?? '—'}ms
              </p>
            </div>
            <div className='p-4 rounded-2xl border border-border/60 bg-card'>
              <p className='text-xs text-muted-foreground mb-1'>Total redirects served</p>
              <p className='text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>
                {stats?.totalRedirects.toLocaleString() ?? '—'}
              </p>
            </div>
            <div className='p-4 rounded-2xl border border-border/60 bg-card'>
              <p className='text-xs text-muted-foreground mb-1'>AI scans today</p>
              <p className={cn(
                'text-2xl font-bold',
                (stats?.aiScansToday ?? 0) / (stats?.aiScanLimit ?? 1500) < 0.8 && 'text-emerald-600 dark:text-emerald-400',
                (stats?.aiScansToday ?? 0) / (stats?.aiScanLimit ?? 1500) >= 0.8 && 'text-amber-600 dark:text-amber-400',
              )}>
                {stats?.aiScansToday ?? 0}
                <span className='text-sm font-normal text-muted-foreground ml-1'>
                  / {stats?.aiScanLimit ?? 1500}
                </span>
              </p>
              {/* Usage bar */}
              <div className='mt-2 h-1.5 bg-muted rounded-full overflow-hidden'>
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    (stats?.aiScansToday ?? 0) / (stats?.aiScanLimit ?? 1500) < 0.8
                      ? 'bg-emerald-500'
                      : 'bg-amber-500',
                  )}
                  style={{
                    width: `${Math.min(100, Math.round(((stats?.aiScansToday ?? 0) / (stats?.aiScanLimit ?? 1500)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
