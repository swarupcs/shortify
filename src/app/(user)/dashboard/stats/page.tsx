import { Metadata } from 'next';
import { db } from '@/server/db';
import { urls } from '@/server/db/schema';
import { count, sql } from 'drizzle-orm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart3, Link2, MousePointerClick } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Statistics | ShortLink',
  description: 'Statistics about our URL shortener service',
};

export default async function PublicStatsPage() {
  const [urlCount] = await db.select({ value: count() }).from(urls);
  const totalUrls = urlCount?.value || 0;

  const [clicksResult] = await db
    .select({ total: sql<number>`sum(${urls.clicks})` })
    .from(urls);
  const totalClicks = clicksResult?.total || 0;

  const stats = [
    {
      label: 'Total URLs Shortened',
      description: 'Number of URLs shortened with our service',
      value: totalUrls.toLocaleString(),
      icon: <Link2 className='size-5' />,
      accent:
        'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
    },
    {
      label: 'Total Clicks',
      description: 'Total number of redirects through our service',
      value: totalClicks.toLocaleString(),
      icon: <MousePointerClick className='size-5' />,
      accent:
        'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30',
    },
  ];

  return (
    <div className='relative overflow-hidden'>
      {/* Subtle bg gradient */}
      <div className='absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 dark:from-violet-500/15 dark:via-fuchsia-500/10 dark:to-pink-500/10 blur-3xl -z-10' />

      <div className='container max-w-4xl mx-auto py-16 px-4'>
        {/* Header */}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 text-sm font-medium mb-6'>
            <BarChart3 className='size-3.5' />
            Live Service Stats
          </div>
          <h1 className='text-4xl font-bold tracking-tight mb-3 bg-gradient-to-br from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent'>
            Service Statistics
          </h1>
          <p className='text-muted-foreground max-w-md mx-auto'>
            Real-time numbers from the ShortLink platform
          </p>
        </div>

        {/* Stats cards */}
        <div className='grid gap-4 md:grid-cols-2 mb-12'>
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className='shadow-sm border-border/60 rounded-2xl hover:border-border hover:shadow-md transition-all duration-200'
            >
              <CardHeader className='pb-2'>
                <div className='flex items-center gap-2 mb-1'>
                  <div className={`p-2 rounded-xl ${stat.accent}`}>
                    {stat.icon}
                  </div>
                </div>
                <CardTitle className='text-lg'>{stat.label}</CardTitle>
                <CardDescription>{stat.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card className='shadow-sm border-border/60 rounded-2xl overflow-hidden'>
          <div className='relative bg-gradient-to-br from-violet-600 to-fuchsia-700 dark:from-violet-800 dark:to-fuchsia-900 p-8 text-center text-white'>
            <div
              className='absolute inset-0 opacity-10 pointer-events-none'
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '28px 28px',
              }}
            />
            <Link2 className='size-8 mx-auto mb-3 opacity-80' />
            <CardTitle className='text-white text-xl mb-1'>
              Want personal statistics?
            </CardTitle>
            <CardDescription className='text-white/70 mb-6 max-w-sm mx-auto'>
              Sign up for a free account to track your own shortened URLs with
              detailed analytics.
            </CardDescription>
            <div className='flex flex-col sm:flex-row justify-center gap-3'>
              <Button
                asChild
                className='bg-white text-violet-700 hover:bg-white/90 border-0 font-semibold'
              >
                <Link href='/register'>Create Free Account</Link>
              </Button>
              <Button
                variant='outline'
                asChild
                className='border-white/30 text-white hover:bg-white/10 bg-transparent'
              >
                <Link href='/login'>Log In</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
