'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserUrls } from '@/server/actions/urls/get-user-urls';
import {
  BarChart3,
  Link2,
  Loader2,
  MousePointerClick,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
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

// Chart colours drawn from the project's CSS chart vars
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function StatsPage() {
  const { data: session, status } = useSession();
  const [userUrls, setUserUrls] = useState<Url[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
    if (status === 'authenticated' && session?.user?.id) {
      (async () => {
        try {
          const response = await getUserUrls(session.user.id);
          if (response.success && response.data) {
            setUserUrls(response.data);
          }
        } catch (error) {
          console.error('Error fetching user URLs', error);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [session, status]);

  const totalClicks = userUrls.reduce((sum, url) => sum + url.clicks, 0);
  const avgClicks =
    userUrls.length > 0
      ? Math.round((totalClicks / userUrls.length) * 10) / 10
      : 0;

  // Fix #8: topUrls derived inside useMemo so chart memos depend on it correctly
  const topUrls = useMemo(
    () => [...userUrls].sort((a, b) => b.clicks - a.clicks).slice(0, 5),
    [userUrls],
  );

  const barChartData = useMemo(
    () =>
      topUrls.map((url) => ({
        url: url.shortCode,
        clicks: url.clicks,
        originalUrl: url.originalUrl,
      })),
    [topUrls],
  );

  const pieChartData = useMemo(
    () =>
      topUrls.map((url, index) => ({
        name: url.shortCode,
        value: url.clicks,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      })),
    [topUrls],
  );

  const barChartConfig = useMemo(() => {
    const cfg: ChartConfig = {
      clicks: { label: 'Clicks', color: CHART_COLORS[0] },
    };
    topUrls.forEach((url, i) => {
      cfg[url.shortCode] = {
        label: url.shortCode,
        color: CHART_COLORS[i % CHART_COLORS.length],
      };
    });
    return cfg;
  }, [topUrls]);

  const pieChartConfig = useMemo(() => {
    const cfg: ChartConfig = { visitors: { label: 'Clicks' } };
    topUrls.forEach((url, i) => {
      cfg[url.shortCode] = {
        label: url.shortCode,
        color: CHART_COLORS[i % CHART_COLORS.length],
      };
    });
    return cfg;
  }, [topUrls]);

  if (status === 'loading' || loading) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <div className='flex flex-col items-center gap-3'>
          <Loader2 className='size-8 animate-spin text-violet-600 dark:text-violet-400' />
          <p className='text-sm text-muted-foreground'>Loading your stats…</p>
        </div>
      </div>
    );
  }

  const summaryStats = [
    {
      label: 'Total URLs',
      value: userUrls.length,
      description: "Links you've created",
      icon: <Link2 className='size-4' />,
      accent:
        'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
    },
    {
      label: 'Total Clicks',
      value: totalClicks.toLocaleString(),
      description: 'Across all your URLs',
      icon: <MousePointerClick className='size-4' />,
      accent:
        'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30',
    },
    {
      label: 'Average Clicks',
      value: avgClicks,
      description: 'Per URL',
      icon: <BarChart3 className='size-4' />,
      accent:
        'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
    },
  ];

  return (
    <div className='max-w-5xl mx-auto space-y-8'>
      {/* Page header */}
      <div className='flex items-center gap-3'>
        <div className='size-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shrink-0'>
          <BarChart3 className='size-5' />
        </div>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>URL Statistics</h1>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Performance overview for all your shortened links
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        {summaryStats.map((stat) => (
          <Card
            key={stat.label}
            className='border-border/60 rounded-2xl hover:border-border hover:shadow-md transition-all duration-200'
          >
            <CardHeader className='pb-2'>
              <div
                className={`inline-flex p-2 rounded-xl mb-1 w-fit ${stat.accent}`}
              >
                {stat.icon}
              </div>
              <CardTitle className='text-base'>{stat.label}</CardTitle>
              <CardDescription className='text-xs'>
                {stat.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>
                {stat.value}
              </p>
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
                Top {topUrls.length} URLs ranked by click count
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-6'>
          {barChartData.length > 0 ? (
            <Tabs defaultValue='bar' className='w-full'>
              {/* Tab switcher — violet themed */}
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

              {/* ── Bar chart ── */}
              <TabsContent value='bar' className='mt-0'>
                <Card className='border-border/60 rounded-2xl'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-base'>URL Performance</CardTitle>
                    <CardDescription className='text-xs'>
                      Click count for your top {topUrls.length} links
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Use ResponsiveContainer so the chart fills width properly */}
                    <div className='w-full h-[320px]'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                          data={barChartData}
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
                            cursor={{
                              fill: 'hsl(var(--muted))',
                              radius: 4,
                            }}
                            contentStyle={{
                              background: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '12px',
                              color: 'hsl(var(--foreground))',
                              fontSize: '12px',
                            }}
                            formatter={(value: number) => [
                              `${value} clicks`,
                              'Clicks',
                            ]}
                            labelFormatter={(label) => `/${label}`}
                          />
                          <Bar dataKey='clicks' radius={[6, 6, 0, 0]}>
                            {barChartData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
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
                          Trending up — {((avgClicks / 5) * 100).toFixed(1)}%
                          above baseline
                          <TrendingUp className='size-4 text-emerald-500' />
                        </>
                      ) : (
                        <>
                          {Math.max(0, 5 - avgClicks).toFixed(1)} more avg
                          clicks would hit baseline
                          <TrendingDown className='size-4 text-amber-500' />
                        </>
                      )}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Showing click count for your top {topUrls.length} URLs
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* ── Pie chart ── */}
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
                            formatter={(value: number, name: string) => [
                              `${value} clicks`,
                              `/${name}`,
                            ]}
                          />
                          <Pie
                            data={pieChartData}
                            dataKey='value'
                            nameKey='name'
                            cx='50%'
                            cy='50%'
                            innerRadius={70}
                            outerRadius={120}
                            strokeWidth={3}
                            stroke='hsl(var(--background))'
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
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
                      {pieChartData.map((entry) => (
                        <div
                          key={entry.name}
                          className='flex items-center gap-1.5 text-xs text-muted-foreground'
                        >
                          <span
                            className='size-2.5 rounded-full shrink-0'
                            style={{ background: entry.fill }}
                          />
                          /{entry.name}
                          <span className='text-foreground font-medium'>
                            ({entry.value})
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className='flex-col items-start gap-1 text-sm border-t border-border/60 pt-4'>
                    <div className='flex items-center gap-2 font-medium leading-none text-foreground'>
                      {avgClicks > 5 ? (
                        <>
                          Trending up — {((avgClicks / 5) * 100).toFixed(1)}%
                          above baseline
                          <TrendingUp className='size-4 text-emerald-500' />
                        </>
                      ) : (
                        <>
                          {Math.max(0, 5 - avgClicks).toFixed(1)} more avg
                          clicks would hit baseline
                          <TrendingDown className='size-4 text-amber-500' />
                        </>
                      )}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Showing click distribution for your top {topUrls.length}{' '}
                      URLs
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className='flex flex-col items-center justify-center py-20 text-center'>
              <div className='size-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4'>
                <BarChart3 className='size-6 text-violet-600 dark:text-violet-400' />
              </div>
              <p className='font-medium mb-1'>No data yet</p>
              <p className='text-sm text-muted-foreground max-w-xs'>
                Create some short URLs and share them — your stats will appear
                here once clicks start rolling in.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
