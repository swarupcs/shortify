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
import {
  BarChart3,
  Link2,
  MousePointerClick,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Statistics | Shortify',
  description: 'Live statistics for the Shortify platform',
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
      description: 'Links created through Shortify',
      value: totalUrls.toLocaleString(),
      icon: <Link2 className='size-5' />,
      accent:
        'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
    },
    {
      label: 'Total Clicks',
      description: 'Redirects processed by our service',
      value: totalClicks.toLocaleString(),
      icon: <MousePointerClick className='size-5' />,
      accent:
        'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30',
    },
  ];

  const features = [
    {
      icon: <Zap className='size-4' />,
      label: 'Instant shortening with AI safety scan',
    },
    {
      icon: <BarChart3 className='size-4' />,
      label: 'Real-time click analytics per link',
    },
    {
      icon: <Shield className='size-4' />,
      label: 'Gemini AI checks every URL before shortening',
    },
    {
      icon: <Link2 className='size-4' />,
      label: 'Custom short codes for your brand',
    },
  ];

  return (
    <div className='relative overflow-hidden'>
      {/* Subtle gradient blob */}
      <div className='absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 dark:from-violet-500/15 dark:via-fuchsia-500/10 dark:to-pink-500/10 blur-3xl -z-10' />

      <div className='container max-w-4xl mx-auto py-16 px-4'>
        {/* Header */}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 text-sm font-medium mb-6'>
            <BarChart3 className='size-3.5' />
            Live Platform Stats
          </div>
          <h1 className='text-4xl font-bold tracking-tight mb-3 bg-gradient-to-br from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent'>
            Shortify by the numbers
          </h1>
          <p className='text-muted-foreground max-w-md mx-auto'>
            Real-time statistics from our URL shortening platform
          </p>
        </div>

        {/* Live stat cards */}
        <div className='grid gap-4 md:grid-cols-2 mb-12'>
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className='shadow-sm border-border/60 rounded-2xl hover:border-border hover:shadow-md transition-all duration-200'
            >
              <CardHeader className='pb-2'>
                <div
                  className={`inline-flex p-2.5 rounded-xl w-fit mb-2 ${stat.accent}`}
                >
                  {stat.icon}
                </div>
                <CardTitle className='text-lg'>{stat.label}</CardTitle>
                <CardDescription>{stat.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-5xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features list */}
        <div className='grid sm:grid-cols-2 gap-3 mb-12'>
          {features.map((f) => (
            <div
              key={f.label}
              className='flex items-center gap-3 p-4 rounded-2xl border border-border/60 bg-card hover:border-border transition-colors'
            >
              <div className='size-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0'>
                {f.icon}
              </div>
              <span className='text-sm font-medium'>{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <Card className='shadow-sm border-border/60 rounded-2xl overflow-hidden'>
          <div className='relative bg-gradient-to-br from-violet-600 to-fuchsia-700 dark:from-violet-800 dark:to-fuchsia-900 p-10 text-center text-white'>
            <div
              className='absolute inset-0 opacity-10 pointer-events-none'
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '28px 28px',
              }}
            />
            <Link2 className='size-8 mx-auto mb-3 opacity-80' />
            <h2 className='text-2xl font-bold mb-2'>Track your own links</h2>
            <p className='text-white/70 mb-6 max-w-sm mx-auto text-sm'>
              Sign up free to get personal analytics, custom codes, and more.
            </p>
            <div className='flex flex-col sm:flex-row justify-center gap-3'>
              <Button
                asChild
                className='bg-white text-violet-700 hover:bg-white/90 border-0 font-semibold gap-2'
              >
                <Link href='/register'>
                  Create Free Account
                  <ArrowRight className='size-4' />
                </Link>
              </Button>
              <Button
                variant='outline'
                asChild
                className='border-white/30 text-white hover:bg-white/10 bg-transparent'
              >
                <Link href='/login'>Sign In</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
