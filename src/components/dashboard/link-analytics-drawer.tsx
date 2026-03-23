'use client';

import { useEffect, useState } from 'react';
import { getLinkAnalytics, type LinkAnalytics } from '@/server/actions/urls/get-link-analytics';
import {
  X, Loader2, MousePointerClick, Globe, ExternalLink,
  Monitor, Smartphone, Tablet, Chrome,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function countryFlag(code: string): string {
  if (!code || code === 'Unknown') return '🌍';
  try {
    const codePoints = [...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch { return '🌍'; }
}

function DeviceIcon({ device }: { device: string }) {
  switch (device.toLowerCase()) {
    case 'mobile':  return <Smartphone className='size-4' />;
    case 'tablet':  return <Tablet className='size-4' />;
    default:        return <Monitor className='size-4' />;
  }
}

interface LinkAnalyticsDrawerProps {
  urlId: number | null;
  shortCode: string;
  onClose: () => void;
}

export function LinkAnalyticsDrawer({ urlId, shortCode, onClose }: LinkAnalyticsDrawerProps) {
  const [data, setData] = useState<LinkAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!urlId) return;
    setLoading(true);
    setError(null);
    getLinkAnalytics(urlId)
      .then((res) => {
        if (res.success && res.data) setData(res.data);
        else setError(res.error ?? 'Failed to load analytics');
      })
      .finally(() => setLoading(false));
  }, [urlId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Drawer */}
      <div className='fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-background border-l border-border/60 shadow-2xl overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-background/95 backdrop-blur border-b border-border/60 px-6 py-4 flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-xs text-muted-foreground mb-0.5'>Link analytics</p>
            <p className='font-mono text-sm font-semibold text-violet-600 dark:text-violet-400 truncate'>
              /r/{shortCode}
            </p>
            {data && (
              <a
                href={data.originalUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5 truncate transition-colors'
              >
                {data.originalUrl} <ExternalLink className='size-3 shrink-0' />
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className='shrink-0 size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
          >
            <X className='size-4' />
          </button>
        </div>

        {/* Body */}
        <div className='p-6 space-y-6'>
          {loading ? (
            <div className='flex justify-center py-20'>
              <Loader2 className='size-7 animate-spin text-violet-600 dark:text-violet-400' />
            </div>
          ) : error ? (
            <div className='text-center py-20 text-sm text-muted-foreground'>{error}</div>
          ) : data ? (
            <>
              {/* Total clicks */}
              <div className='p-4 rounded-2xl border border-border/60 bg-card'>
                <p className='text-xs text-muted-foreground mb-1 flex items-center gap-1.5'>
                  <MousePointerClick className='size-3.5' /> Total clicks (all time)
                </p>
                <p className='text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>
                  {data.totalClicks.toLocaleString()}
                </p>
              </div>

              {/* Timeline */}
              <div>
                <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3'>
                  Clicks — last 30 days
                </p>
                {data.timeSeries.length > 0 ? (
                  <div className='h-[180px]'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <LineChart data={data.timeSeries} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='hsl(var(--border))' />
                        <XAxis dataKey='date' tickLine={false} axisLine={false}
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickMargin={6}
                          tickFormatter={(d) => { try { return format(new Date(d), 'MMM d'); } catch { return d; } }}
                          interval='preserveStartEnd'
                        />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '12px' }}
                          formatter={(v: number) => [`${v} click${v !== 1 ? 's' : ''}`, 'Clicks']}
                          labelFormatter={(d) => { try { return format(new Date(d), 'PPP'); } catch { return d; } }}
                        />
                        <Line type='monotone' dataKey='clicks' stroke='hsl(var(--chart-1))' strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground text-center py-8'>No clicks in the last 30 days.</p>
                )}
              </div>

              {/* Device + Browser grid */}
              <div className='grid grid-cols-2 gap-4'>
                {/* Devices */}
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3'>Devices</p>
                  {data.byDevice.length > 0 ? (
                    <div className='space-y-2'>
                      {data.byDevice.map((d, i) => {
                        const max = data.byDevice[0].clicks;
                        const pct = Math.round((d.clicks / max) * 100);
                        return (
                          <div key={d.device} className='flex items-center gap-2'>
                            <span className='text-muted-foreground'><DeviceIcon device={d.device} /></span>
                            <span className='text-xs text-muted-foreground capitalize w-14 shrink-0'>{d.device}</span>
                            <div className='flex-1 h-1.5 bg-muted rounded-full overflow-hidden'>
                              <div className='h-full rounded-full' style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                            </div>
                            <span className='text-xs font-medium tabular-nums w-6 text-right'>{d.clicks}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className='text-xs text-muted-foreground'>No data yet.</p>}
                </div>

                {/* Browsers */}
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3'>Browsers</p>
                  {data.byBrowser.length > 0 ? (
                    <div className='space-y-2'>
                      {data.byBrowser.map((b, i) => {
                        const max = data.byBrowser[0].clicks;
                        const pct = Math.round((b.clicks / max) * 100);
                        return (
                          <div key={b.browser} className='flex items-center gap-2'>
                            <Chrome className='size-3.5 text-muted-foreground shrink-0' />
                            <span className='text-xs text-muted-foreground w-14 shrink-0 truncate'>{b.browser}</span>
                            <div className='flex-1 h-1.5 bg-muted rounded-full overflow-hidden'>
                              <div className='h-full rounded-full' style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                            </div>
                            <span className='text-xs font-medium tabular-nums w-6 text-right'>{b.clicks}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className='text-xs text-muted-foreground'>No data yet.</p>}
                </div>
              </div>

              {/* Countries */}
              {data.byCountry.length > 0 && (
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3'>
                    Top countries
                  </p>
                  <div className='space-y-2'>
                    {data.byCountry.map((c) => {
                      const max = data.byCountry[0].clicks;
                      const pct = Math.round((c.clicks / max) * 100);
                      return (
                        <div key={c.country} className='flex items-center gap-3'>
                          <span className='text-base w-6 shrink-0'>{countryFlag(c.country)}</span>
                          <span className='text-xs text-muted-foreground w-8 font-mono shrink-0'>{c.country}</span>
                          <div className='flex-1 h-1.5 bg-muted rounded-full overflow-hidden'>
                            <div className='h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500' style={{ width: `${pct}%` }} />
                          </div>
                          <span className='text-xs font-medium tabular-nums w-6 text-right'>{c.clicks}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Referrers */}
              {data.byReferrer.length > 0 && (
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3'>
                    Top referrers
                  </p>
                  <div className='space-y-2'>
                    {data.byReferrer.map((r) => {
                      const max = data.byReferrer[0].clicks;
                      const pct = Math.round((r.clicks / max) * 100);
                      return (
                        <div key={r.referrer} className='flex items-center gap-3'>
                          <span className='text-xs text-muted-foreground flex-1 truncate font-mono'>{r.referrer}</span>
                          <div className='w-20 h-1.5 bg-muted rounded-full overflow-hidden shrink-0'>
                            <div className='h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500' style={{ width: `${pct}%` }} />
                          </div>
                          <span className='text-xs font-medium tabular-nums w-6 text-right'>{r.clicks}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
