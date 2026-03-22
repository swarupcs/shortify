'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Link2,
  MousePointerClick,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Url {
  id: number;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clicks: number;
}

interface AnalyticsTabProps {
  urls: Url[];
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function AnalyticsTab({ urls }: AnalyticsTabProps) {
  const totalClicks = urls.reduce((sum, u) => sum + u.clicks, 0);
  const avgClicks =
    urls.length > 0
      ? Math.round((totalClicks / urls.length) * 10) / 10
      : 0;

  const topUrls = useMemo(
    () => [...urls].sort((a, b) => b.clicks - a.clicks).slice(0, 5),
    [urls],
  );

  const barData = useMemo(
    () =>
      topUrls.map((u) => ({
        url: u.shortCode,
        clicks: u.clicks,
        original: u.originalUrl,
      })),
    [topUrls],
  );

  const pieData = useMemo(
    () =>
      topUrls.map((u, i) => ({
        name: u.shortCode,
        value: u.clicks,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [topUrls],
  );

  const summaryStats = [
    {
      label: 'Total Links',
      value: urls.length,
      desc: "Links you've created",
      icon: <Link2 className='size-4' />,
      accent:
        'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
    },
    {
      label: 'Total Clicks',
      value: totalClicks.toLocaleString(),
      desc: 'Across all your URLs',
      icon: <MousePointerClick className='size-4' />,
      accent:
        'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30',
    },
    {
      label: 'Average Clicks',
      value: avgClicks,
      desc: 'Per URL',
      icon: <BarChart3 className='size-4' />,
      accent:
        'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
    },
    {
      label: 'Top Performer',
      value: topUrls[0]?.clicks ?? 0,
      desc: topUrls[0] ? `/${topUrls[0].shortCode}` : 'No links yet',
      icon: <Zap className='size-4' />,
      accent:
        'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30',
    },
  ];

  const trendLabel =
    avgClicks > 5
      ? `${((avgClicks / 5) * 100).toFixed(1)}% above baseline`
      : `${Math.max(0, 5 - avgClicks).toFixed(1)} more avg clicks to hit baseline`;

  if (urls.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <div className='size-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4'>
          <BarChart3 className='size-6 text-violet-600 dark:text-violet-400' />
        </div>
        <p className='font-medium mb-1'>No data yet</p>
        <p className='text-sm text-muted-foreground max-w-xs'>
          Create some short URLs and share them — analytics will appear once
          clicks come in.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Summary cards */}
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {summaryStats.map((stat) => (
          <Card
            key={stat.label}
            className='border-border/60 rounded-2xl hover:border-border hover:shadow-sm transition-all duration-200'
          >
            <CardHeader className='pb-2'>
              <div className={`inline-flex p-2 rounded-xl mb-1 w-fit ${stat.accent}`}>
                {stat.icon}
              </div>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0'>
              <p className='text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>
                {stat.value}
              </p>
              <p className='text-xs text-muted-foreground mt-1'>{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Card className='border-border/60 rounded-2xl shadow-sm'>
        <CardHeader className='border-b border-border/60 bg-muted/20 rounded-t-2xl'>
          <div className='flex items-center gap-2'>
            <div className='size-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
              <BarChart3 className='size-3.5' />
            </div>
            <div>
              <CardTitle className='text-base'>Top Performing URLs</CardTitle>
              <CardDescription className='text-xs mt-0.5'>
                Top {topUrls.length} URLs by click count
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-6'>
          {barData.length > 0 ? (
            <Tabs defaultValue='bar' className='w-full'>
              <TabsList className='mb-6 bg-muted/50 border border-border/60 rounded-xl p-1'>
                <TabsTrigger
                  value='bar'
                  className='rounded-lg text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all'
                >
                  Bar Chart
                </TabsTrigger>
                <TabsTrigger
                  value='pie'
                  className='rounded-lg text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all'
                >
                  Pie Chart
                </TabsTrigger>
              </TabsList>

              {/* Bar */}
              <TabsContent value='bar' className='mt-0'>
                <Card className='border-border/60 rounded-2xl'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base'>Click Performance</CardTitle>
                    <CardDescription className='text-xs'>
                      Click count for your top {topUrls.length} links
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='w-full h-[320px]'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                          data={barData}
                          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                        >
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray='3 3'
                            stroke='hsl(var(--border))'
                          />
                          <XAxis
                            dataKey='url'
                            tickLine={false}
                            axisLine={false}
                            tick={{
                              fontSize: 12,
                              fill: 'hsl(var(--muted-foreground))',
                            }}
                            tickMargin={8}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{
                              fontSize: 12,
                              fill: 'hsl(var(--muted-foreground))',
                            }}
                            tickMargin={8}
                          />
                          <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                            contentStyle={{
                              background: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '12px',
                              color: 'hsl(var(--foreground))',
                              fontSize: '12px',
                            }}
                            formatter={(v: number) => [`${v} clicks`, 'Clicks']}
                            labelFormatter={(l) => `/${l}`}
                          />
                          <Bar dataKey='clicks' radius={[6, 6, 0, 0]}>
                            {barData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={CHART_COLORS[i % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                  <CardFooter className='flex-col items-start gap-1 text-sm border-t border-border/60 pt-4'>
                    <div className='flex gap-2 font-medium leading-none text-foreground'>
                      {avgClicks > 5 ? (
                        <>
                          <TrendingUp className='size-4 text-emerald-500' />
                          Trending up — {trendLabel}
                        </>
                      ) : (
                        <>
                          <TrendingDown className='size-4 text-amber-500' />
                          {trendLabel}
                        </>
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      Showing click count for your top {topUrls.length} URLs
                    </p>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Pie */}
              <TabsContent value='pie' className='mt-0'>
                <Card className='border-border/60 rounded-2xl'>
                  <CardHeader className='items-center pb-2'>
                    <CardTitle className='text-base'>
                      Click Distribution
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      How clicks are spread across your top {topUrls.length}{' '}
                      URLs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='flex flex-col items-center'>
                    <div className='w-full max-w-[360px] h-[320px]'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '12px',
                              color: 'hsl(var(--foreground))',
                              fontSize: '12px',
                            }}
                            formatter={(v: number, n: string) => [
                              `${v} clicks`,
                              `/${n}`,
                            ]}
                          />
                          <Pie
                            data={pieData}
                            dataKey='value'
                            nameKey='name'
                            cx='50%'
                            cy='50%'
                            innerRadius={70}
                            outerRadius={120}
                            strokeWidth={3}
                            stroke='hsl(var(--background))'
                          >
                            {pieData.map((e, i) => (
                              <Cell key={i} fill={e.fill} />
                            ))}
                            <Label
                              content={({ viewBox }) => {
                                if (
                                  viewBox &&
                                  'cx' in viewBox &&
                                  'cy' in viewBox
                                ) {
                                  return (
                                    <text
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      textAnchor='middle'
                                      dominantBaseline='middle'
                                    >
                                      <tspan
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        style={{
                                          fill: 'hsl(var(--foreground))',
                                          fontSize: '1.75rem',
                                          fontWeight: 700,
                                        }}
                                      >
                                        {totalClicks.toLocaleString()}
                                      </tspan>
                                      <tspan
                                        x={viewBox.cx}
                                        y={(viewBox.cy || 0) + 22}
                                        style={{
                                          fill: 'hsl(var(--muted-foreground))',
                                          fontSize: '0.75rem',
                                        }}
                                      >
                                        Total Clicks
                                      </tspan>
                                    </text>
                                  );
                                }
                              }}
                            />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className='flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2'>
                      {pieData.map((e) => (
                        <div
                          key={e.name}
                          className='flex items-center gap-1.5 text-xs text-muted-foreground'
                        >
                          <span
                            className='size-2.5 rounded-full shrink-0'
                            style={{ background: e.fill }}
                          />
                          /{e.name}
                          <span className='text-foreground font-medium'>
                            ({e.value})
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className='flex-col items-start gap-1 text-sm border-t border-border/60 pt-4'>
                    <div className='flex items-center gap-2 font-medium leading-none text-foreground'>
                      {avgClicks > 5 ? (
                        <>
                          <TrendingUp className='size-4 text-emerald-500' />
                          Trending up — {trendLabel}
                        </>
                      ) : (
                        <>
                          <TrendingDown className='size-4 text-amber-500' />
                          {trendLabel}
                        </>
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      Showing click distribution for your top {topUrls.length}{' '}
                      URLs
                    </p>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          ) : null}
        </CardContent>
      </Card>

      {/* Per-link performance table */}
      {urls.length > 0 && (
        <Card className='border-border/60 rounded-2xl shadow-sm overflow-hidden'>
          <CardHeader className='border-b border-border/60 bg-muted/20'>
            <CardTitle className='text-base'>All Links Performance</CardTitle>
            <CardDescription className='text-xs'>
              Click breakdown for every link you&apos;ve created
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-border/60 bg-muted/10'>
                    <th className='text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Short Link
                    </th>
                    <th className='text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell'>
                      Original URL
                    </th>
                    <th className='text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-24'>
                      Clicks
                    </th>
                    <th className='text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-24 hidden sm:table-cell'>
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/40'>
                  {[...urls]
                    .sort((a, b) => b.clicks - a.clicks)
                    .map((url) => {
                      const pct =
                        totalClicks > 0
                          ? Math.round((url.clicks / totalClicks) * 100)
                          : 0;
                      return (
                        <tr
                          key={url.id}
                          className='hover:bg-muted/30 transition-colors'
                        >
                          <td className='px-4 py-3'>
                            <span className='font-mono text-violet-600 dark:text-violet-400 font-medium'>
                              /r/{url.shortCode}
                            </span>
                          </td>
                          <td className='px-4 py-3 hidden md:table-cell'>
                            <span className='text-muted-foreground truncate block max-w-xs'>
                              {url.originalUrl}
                            </span>
                          </td>
                          <td className='px-4 py-3 text-right'>
                            <span className='font-semibold'>
                              {url.clicks.toLocaleString()}
                            </span>
                          </td>
                          <td className='px-4 py-3 hidden sm:table-cell'>
                            <div className='flex items-center justify-end gap-2'>
                              <div className='w-16 h-1.5 rounded-full bg-muted overflow-hidden'>
                                <div
                                  className='h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500'
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className='text-xs text-muted-foreground w-8 text-right'>
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
