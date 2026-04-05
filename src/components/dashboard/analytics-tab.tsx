'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  BarChart3, Globe, Link2, MousePointerClick, TrendingDown, TrendingUp,
  Zap, ExternalLink, Download, Monitor, Smartphone, Tablet, Loader2,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Label, Line, LineChart,
  Pie, PieChart, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getClickAnalytics, type ClickAnalytics } from '@/server/actions/urls/get-click-analytics';
import { exportAnalytics } from '@/server/actions/urls/export-analytics';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { LinkAnalyticsDrawer } from './link-analytics-drawer';

interface Url {
  id: number;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clicks: number;
}

interface AnalyticsTabProps { urls: Url[]; }

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
    const pts = [...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...pts);
  } catch { return '🌍'; }
}

function DeviceIcon({ device }: { device: string }) {
  switch (device.toLowerCase()) {
    case 'mobile':  return <Smartphone className='size-4' />;
    case 'tablet':  return <Tablet className='size-4' />;
    default:        return <Monitor className='size-4' />;
  }
}

export function AnalyticsTab({ urls }: AnalyticsTabProps) {
  const { data: session } = useSession();
  const [clickAnalytics, setClickAnalytics]     = useState<ClickAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [exportingType, setExportingType]       = useState<string | null>(null);

  // Per-link drawer
  const [drawerUrlId,     setDrawerUrlId]     = useState<number | null>(null);
  const [drawerShortCode, setDrawerShortCode] = useState('');

  const totalClicks = urls.reduce((s, u) => s + u.clicks, 0);
  const avgClicks   = urls.length > 0 ? Math.round((totalClicks / urls.length) * 10) / 10 : 0;
  const topUrls     = useMemo(() => [...urls].sort((a, b) => b.clicks - a.clicks).slice(0, 5), [urls]);
  const barData     = useMemo(() => topUrls.map((u) => ({ url: u.shortCode, clicks: u.clicks, original: u.originalUrl })), [topUrls]);
  const pieData     = useMemo(() => topUrls.map((u, i) => ({ name: u.shortCode, value: u.clicks, fill: CHART_COLORS[i % CHART_COLORS.length] })), [topUrls]);

  useEffect(() => {
    if (!session?.user?.id || urls.length === 0) return;
    setLoadingAnalytics(true);
    getClickAnalytics()
      .then((res) => { if (res.success && res.data) setClickAnalytics(res.data); })
      .finally(() => setLoadingAnalytics(false));
  }, [session?.user?.id, urls.length]);

  const handleExport = async (type: 'summary' | 'per-link' | 'raw') => {
    setExportingType(type);
    try {
      const result = await exportAnalytics(type);
      if (!result.success || !result.data) {
        toast.error('Export failed', { description: result.error });
        return;
      }
      // Trigger browser download
      const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = result.data.filename ?? 'export.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExportingType(null);
    }
  };

  const openDrawer = (urlId: number, shortCode: string) => {
    setDrawerUrlId(urlId);
    setDrawerShortCode(shortCode);
  };

  const summaryStats = [
    { label: 'Total Links',    value: urls.length,             desc: "Links you've created",  icon: <Link2 className='size-4' />,              accent: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30' },
    { label: 'Total Clicks',   value: totalClicks.toLocaleString(), desc: 'Across all your URLs', icon: <MousePointerClick className='size-4' />, accent: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30' },
    { label: 'Average Clicks', value: avgClicks,               desc: 'Per URL',               icon: <BarChart3 className='size-4' />,          accent: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30' },
    { label: 'Top Performer',  value: topUrls[0]?.clicks ?? 0, desc: topUrls[0] ? `/${topUrls[0].shortCode}` : 'No links yet', icon: <Zap className='size-4' />, accent: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30' },
  ];

  const trendLabel = avgClicks > 5
    ? `${((avgClicks / 5) * 100).toFixed(1)}% above baseline`
    : `${Math.max(0, 5 - avgClicks).toFixed(1)} more avg clicks to hit baseline`;

  if (urls.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <div className='size-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4'>
          <BarChart3 className='size-6 text-violet-600 dark:text-violet-400' />
        </div>
        <p className='font-medium mb-1'>No data yet</p>
        <p className='text-sm text-muted-foreground max-w-xs'>Create short URLs and share them — analytics will appear once clicks come in.</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Summary cards */}
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {summaryStats.map((stat) => (
          <Card key={stat.label} className='border-border/60 rounded-2xl hover:border-border hover:shadow-sm transition-all duration-200'>
            <CardHeader className='pb-2'>
              <div className={`inline-flex p-2 rounded-xl mb-1 w-fit ${stat.accent}`}>{stat.icon}</div>
              <CardTitle className='text-sm font-medium text-muted-foreground'>{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className='pt-0'>
              <p className='text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>{stat.value}</p>
              <p className='text-xs text-muted-foreground mt-1'>{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export bar */}
      <div className='flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card'>
        <div>
          <p className='text-sm font-medium'>Export analytics</p>
          <p className='text-xs text-muted-foreground mt-0.5'>Download your data as CSV</p>
        </div>
        <div className='flex items-center gap-2'>
          {(['summary', 'per-link', 'raw'] as const).map((type) => (
            <Button key={type} variant='outline' size='sm'
              className='gap-1.5 text-xs border-border/60 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400'
              disabled={!!exportingType}
              onClick={() => handleExport(type)}
            >
              {exportingType === type
                ? <Loader2 className='size-3 animate-spin' />
                : <Download className='size-3' />}
              {type === 'summary' ? 'Summary' : type === 'per-link' ? 'Per Link' : 'Raw Events'}
            </Button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <Card className='border-border/60 rounded-2xl shadow-sm'>
        <CardHeader className='border-b border-border/60 bg-muted/20 rounded-t-2xl'>
          <div className='flex items-center gap-2'>
            <div className='size-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
              <BarChart3 className='size-3.5' />
            </div>
            <div>
              <CardTitle className='text-base'>Performance</CardTitle>
              <CardDescription className='text-xs mt-0.5'>Click data across all your links</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-6'>
          <Tabs defaultValue='bar' className='w-full'>
            <TabsList className='mb-6 bg-muted/50 border border-border/60 rounded-xl p-1 flex-wrap h-auto gap-1'>
              {['bar', 'pie', 'timeline', 'countries', 'devices'].map((v) => (
                <TabsTrigger key={v} value={v}
                  className='rounded-lg text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all capitalize'>
                  {v === 'bar' ? 'Bar Chart' : v === 'pie' ? 'Pie Chart' : v === 'timeline' ? 'Timeline' : v === 'countries' ? 'Countries' : 'Devices'}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Bar Chart */}
            <TabsContent value='bar' className='mt-0'>
              <Card className='border-border/60 rounded-2xl'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base'>Click Performance</CardTitle>
                  <CardDescription className='text-xs'>Top {topUrls.length} links by click count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='w-full h-[320px]'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='hsl(var(--border))' />
                        <XAxis dataKey='url' tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickMargin={8} />
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))', fontSize: '12px' }}
                          formatter={(v: number) => [`${v} clicks`, 'Clicks']} labelFormatter={(l) => `/${l}`} />
                        <Bar dataKey='clicks' radius={[6, 6, 0, 0]}>
                          {barData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <CardFooter className='flex-col items-start gap-1 text-sm border-t border-border/60 pt-4'>
                  <div className='flex gap-2 font-medium leading-none text-foreground'>
                    {avgClicks > 5
                      ? <><TrendingUp className='size-4 text-emerald-500' />Trending up — {trendLabel}</>
                      : <><TrendingDown className='size-4 text-amber-500' />{trendLabel}</>}
                  </div>
                  <p className='text-xs text-muted-foreground'>Showing top {topUrls.length} URLs</p>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Pie Chart */}
            <TabsContent value='pie' className='mt-0'>
              <Card className='border-border/60 rounded-2xl'>
                <CardHeader className='items-center pb-2'>
                  <CardTitle className='text-base'>Click Distribution</CardTitle>
                  <CardDescription className='text-xs'>How clicks spread across top {topUrls.length} URLs</CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col items-center'>
                  <div className='w-full max-w-[360px] h-[320px]'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))', fontSize: '12px' }}
                          formatter={(v: number, n: string) => [`${v} clicks`, `/${n}`]} />
                        <Pie data={pieData} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={70} outerRadius={120} strokeWidth={3} stroke='hsl(var(--background))'>
                          {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          <Label content={({ viewBox }) => {
                            if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                              return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor='middle' dominantBaseline='middle'>
                                  <tspan x={viewBox.cx} y={viewBox.cy} style={{ fill: 'hsl(var(--foreground))', fontSize: '1.75rem', fontWeight: 700 }}>{totalClicks.toLocaleString()}</tspan>
                                  <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 22} style={{ fill: 'hsl(var(--muted-foreground))', fontSize: '0.75rem' }}>Total Clicks</tspan>
                                </text>
                              );
                            }
                          }} />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className='flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2'>
                    {pieData.map((e) => (
                      <div key={e.name} className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                        <span className='size-2.5 rounded-full shrink-0' style={{ background: e.fill }} />
                        /{e.name}<span className='text-foreground font-medium'>({e.value})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline */}
            <TabsContent value='timeline' className='mt-0'>
              <Card className='border-border/60 rounded-2xl'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base'>Clicks over time</CardTitle>
                  <CardDescription className='text-xs'>Daily click volume — last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingAnalytics ? (
                    <div className='h-[320px] flex items-center justify-center text-muted-foreground text-sm'>Loading timeline…</div>
                  ) : clickAnalytics && clickAnalytics.timeSeries.length > 0 ? (
                    <div className='w-full h-[320px]'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <LineChart data={clickAnalytics.timeSeries} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                          <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='hsl(var(--border))' />
                          <XAxis dataKey='date' tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickMargin={8}
                            tickFormatter={(d) => { try { return format(new Date(d), 'MMM d'); } catch { return d; } }} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickMargin={8} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))', fontSize: '12px' }}
                            formatter={(v: number) => [`${v} clicks`, 'Clicks']}
                            labelFormatter={(d) => { try { return format(new Date(d), 'PPP'); } catch { return d; } }} />
                          <Line type='monotone' dataKey='clicks' stroke='hsl(var(--chart-1))' strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className='h-[320px] flex flex-col items-center justify-center text-center gap-2'>
                      <BarChart3 className='size-8 text-muted-foreground/40' />
                      <p className='text-sm text-muted-foreground'>No click events recorded yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Countries + Referrers */}
            <TabsContent value='countries' className='mt-0'>
              <div className='grid sm:grid-cols-2 gap-4'>
                <Card className='border-border/60 rounded-2xl'>
                  <CardHeader className='pb-2'>
                    <div className='flex items-center gap-2'><Globe className='size-4 text-violet-600 dark:text-violet-400' /><CardTitle className='text-base'>Top countries</CardTitle></div>
                    <CardDescription className='text-xs'>By click count — last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingAnalytics ? <div className='py-10 text-center text-sm text-muted-foreground'>Loading…</div>
                      : clickAnalytics && clickAnalytics.byCountry.length > 0 ? (
                        <div className='space-y-2.5'>
                          {clickAnalytics.byCountry.map((c) => {
                            const max = clickAnalytics.byCountry[0].clicks;
                            const pct = Math.round((c.clicks / max) * 100);
                            return (
                              <div key={c.country} className='flex items-center gap-3'>
                                <span className='text-base w-6 shrink-0'>{countryFlag(c.country)}</span>
                                <span className='text-xs text-muted-foreground w-8 font-mono shrink-0'>{c.country}</span>
                                <div className='flex-1 h-2 bg-muted rounded-full overflow-hidden'>
                                  <div className='h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500' style={{ width: `${pct}%` }} />
                                </div>
                                <span className='text-xs font-medium tabular-nums w-8 text-right'>{c.clicks}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : <div className='py-10 text-center'><p className='text-sm text-muted-foreground'>No country data yet.</p></div>}
                  </CardContent>
                </Card>

                <Card className='border-border/60 rounded-2xl'>
                  <CardHeader className='pb-2'>
                    <div className='flex items-center gap-2'><ExternalLink className='size-4 text-violet-600 dark:text-violet-400' /><CardTitle className='text-base'>Top referrers</CardTitle></div>
                    <CardDescription className='text-xs'>Where your clicks come from</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingAnalytics ? <div className='py-10 text-center text-sm text-muted-foreground'>Loading…</div>
                      : clickAnalytics && clickAnalytics.byReferrer.length > 0 ? (
                        <div className='space-y-2.5'>
                          {clickAnalytics.byReferrer.map((r) => {
                            const max = clickAnalytics.byReferrer[0].clicks;
                            const pct = Math.round((r.clicks / max) * 100);
                            return (
                              <div key={r.referrer} className='flex items-center gap-3'>
                                <span className='text-xs text-muted-foreground flex-1 truncate font-mono'>{r.referrer}</span>
                                <div className='w-20 h-2 bg-muted rounded-full overflow-hidden shrink-0'>
                                  <div className='h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500' style={{ width: `${pct}%` }} />
                                </div>
                                <span className='text-xs font-medium tabular-nums w-8 text-right'>{r.clicks}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : <div className='py-10 text-center'><p className='text-sm text-muted-foreground'>No referrer data yet.</p></div>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Devices + Browsers */}
            <TabsContent value='devices' className='mt-0'>
              <div className='grid sm:grid-cols-2 gap-4'>
                {/* Devices */}
                <Card className='border-border/60 rounded-2xl'>
                  <CardHeader className='pb-2'>
                    <div className='flex items-center gap-2'><Monitor className='size-4 text-violet-600 dark:text-violet-400' /><CardTitle className='text-base'>Devices</CardTitle></div>
                    <CardDescription className='text-xs'>Mobile vs desktop vs tablet — last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingAnalytics ? <div className='py-10 text-center text-sm text-muted-foreground'>Loading…</div>
                      : clickAnalytics && clickAnalytics.byDevice.length > 0 ? (
                        <div className='space-y-3'>
                          {clickAnalytics.byDevice.map((d, i) => {
                            const total = clickAnalytics.byDevice.reduce((s, x) => s + x.clicks, 0);
                            const pct   = Math.round((d.clicks / total) * 100);
                            return (
                              <div key={d.device}>
                                <div className='flex items-center justify-between mb-1'>
                                  <div className='flex items-center gap-2 text-sm'>
                                    <DeviceIcon device={d.device} />
                                    <span className='capitalize font-medium'>{d.device}</span>
                                  </div>
                                  <span className='text-sm text-muted-foreground'>{d.clicks} <span className='text-xs'>({pct}%)</span></span>
                                </div>
                                <div className='h-2 bg-muted rounded-full overflow-hidden'>
                                  <div className='h-full rounded-full transition-all' style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : <div className='py-10 text-center'><p className='text-sm text-muted-foreground'>No device data yet.</p><p className='text-xs text-muted-foreground mt-1'>Clicks after this update will include device info.</p></div>}
                  </CardContent>
                </Card>

                {/* Browsers */}
                <Card className='border-border/60 rounded-2xl'>
                  <CardHeader className='pb-2'>
                    <div className='flex items-center gap-2'><Globe className='size-4 text-violet-600 dark:text-violet-400' /><CardTitle className='text-base'>Browsers</CardTitle></div>
                    <CardDescription className='text-xs'>Browser breakdown — last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingAnalytics ? <div className='py-10 text-center text-sm text-muted-foreground'>Loading…</div>
                      : clickAnalytics && clickAnalytics.byBrowser.length > 0 ? (
                        <div className='space-y-2.5'>
                          {clickAnalytics.byBrowser.map((b, i) => {
                            const max = clickAnalytics.byBrowser[0].clicks;
                            const pct = Math.round((b.clicks / max) * 100);
                            return (
                              <div key={b.browser} className='flex items-center gap-3'>
                                <span className='text-xs text-muted-foreground w-16 shrink-0'>{b.browser}</span>
                                <div className='flex-1 h-2 bg-muted rounded-full overflow-hidden'>
                                  <div className='h-full rounded-full' style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                </div>
                                <span className='text-xs font-medium tabular-nums w-8 text-right'>{b.clicks}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : <div className='py-10 text-center'><p className='text-sm text-muted-foreground'>No browser data yet.</p><p className='text-xs text-muted-foreground mt-1'>Clicks after this update will include browser info.</p></div>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Per-link performance table */}
      <Card className='border-border/60 rounded-2xl shadow-sm overflow-hidden'>
        <CardHeader className='border-b border-border/60 bg-muted/20'>
          <CardTitle className='text-base'>All Links Performance</CardTitle>
          <CardDescription className='text-xs'>Click the chart icon to drill into per-link analytics</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-border/60 bg-muted/10'>
                  <th className='text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide'>Short Link</th>
                  <th className='text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell'>Original URL</th>
                  <th className='text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-24'>Clicks</th>
                  <th className='text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-24 hidden sm:table-cell'>Share</th>
                  <th className='text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-16'>Details</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/40'>
                {[...urls].sort((a, b) => b.clicks - a.clicks).map((url) => {
                  const pct = totalClicks > 0 ? Math.round((url.clicks / totalClicks) * 100) : 0;
                  return (
                    <tr key={url.id} className='hover:bg-muted/30 transition-colors'>
                      <td className='px-4 py-3'><span className='font-mono text-violet-600 dark:text-violet-400 font-medium'>/r/{url.shortCode}</span></td>
                      <td className='px-4 py-3 hidden md:table-cell'><span className='text-muted-foreground truncate block max-w-xs'>{url.originalUrl}</span></td>
                      <td className='px-4 py-3 text-right'><span className='font-semibold'>{url.clicks.toLocaleString()}</span></td>
                      <td className='px-4 py-3 hidden sm:table-cell'>
                        <div className='flex items-center justify-end gap-2'>
                          <div className='w-16 h-1.5 rounded-full bg-muted overflow-hidden'>
                            <div className='h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500' style={{ width: `${pct}%` }} />
                          </div>
                          <span className='text-xs text-muted-foreground w-8 text-right'>{pct}%</span>
                        </div>
                      </td>
                      <td className='px-4 py-3 text-right'>
                        <button
                          onClick={() => openDrawer(url.id, url.shortCode)}
                          className='inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors'
                          title='View link analytics'
                        >
                          <BarChart3 className='size-3.5' />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Per-link analytics drawer */}
      {drawerUrlId !== null && (
        <LinkAnalyticsDrawer
          urlId={drawerUrlId}
          shortCode={drawerShortCode}
          onClose={() => { setDrawerUrlId(null); setDrawerShortCode(''); }}
        />
      )}
    </div>
  );
}
