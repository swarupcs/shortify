import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UrlShortenerForm } from '@/components/urls/url-shortener-form';
import { UserUrlsTable } from '@/components/urls/user-urls-table';
import { getUserUrls } from '@/server/actions/urls/get-user-urls';
import { auth } from '@/server/auth';
import { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Link2, MousePointerClick, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | ShortLink',
  description: 'Manage and track your shortened URLs',
};

export default async function DashboardPage() {
  const session = await auth();
  const response = await getUserUrls(session?.user.id as string);
  const userUrls = response.success && response.data ? response.data : [];

  const totalClicks = userUrls.reduce((sum, u) => sum + u.clicks, 0);
  const topUrl = [...userUrls].sort((a, b) => b.clicks - a.clicks)[0];
  const avgClicks =
    userUrls.length > 0
      ? Math.round((totalClicks / userUrls.length) * 10) / 10
      : 0;

  const stats = [
    {
      label: 'Total Links',
      value: userUrls.length,
      icon: <Link2 className='size-4' />,
      accent:
        'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
      change: null,
    },
    {
      label: 'Total Clicks',
      value: totalClicks.toLocaleString(),
      icon: <MousePointerClick className='size-4' />,
      accent:
        'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30',
      change: null,
    },
    {
      label: 'Avg. Clicks',
      value: avgClicks,
      icon: <BarChart3 className='size-4' />,
      accent:
        'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
      change: null,
    },
    {
      label: 'Top Link Clicks',
      value: topUrl?.clicks ?? 0,
      icon: <TrendingUp className='size-4' />,
      accent:
        'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30',
      change: topUrl ? topUrl.shortCode : '—',
    },
  ];

  return (
    <div className='max-w-6xl mx-auto space-y-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Welcome back
            {session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className='text-muted-foreground text-sm mt-1'>
            Manage and track all your shortened links.
          </p>
        </div>
        <Link
          href='/dashboard/stats'
          className='hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors border border-violet-200 dark:border-violet-800'
        >
          <BarChart3 className='size-4' />
          View Analytics
        </Link>
      </div>

      {/* Stats grid */}
      {userUrls.length > 0 && (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className='p-4 rounded-2xl border border-border/60 bg-card hover:border-border transition-colors'
            >
              <div className={`inline-flex p-2 rounded-lg mb-3 ${stat.accent}`}>
                {stat.icon}
              </div>
              <p className='text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>
                {stat.value}
              </p>
              <p className='text-xs text-muted-foreground mt-1'>{stat.label}</p>
              {stat.change && (
                <p className='text-xs text-muted-foreground/70 mt-0.5 font-mono truncate'>
                  /{stat.change}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Shortener form */}
      <Card className='border-border/60 shadow-sm rounded-2xl overflow-hidden'>
        <CardHeader className='pb-4 border-b border-border/60 bg-muted/20'>
          <div className='flex items-center gap-2'>
            <div className='size-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
              <Link2 className='size-4' />
            </div>
            <div>
              <CardTitle className='text-base'>Create New Short Link</CardTitle>
              <CardDescription className='text-xs'>
                Paste a long URL to generate a shortened link
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-6'>
          <UrlShortenerForm />
        </CardContent>
      </Card>

      {/* URLs table */}
      <Card className='border-border/60 shadow-sm rounded-2xl overflow-hidden'>
        <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-base'>Your Links</CardTitle>
              <CardDescription className='text-xs mt-0.5'>
                {userUrls.length} link
                {userUrls.length !== 1 ? 's' : ''} created
              </CardDescription>
            </div>
            {userUrls.length > 0 && (
              <Link
                href='/dashboard/stats'
                className='text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors'
              >
                <BarChart3 className='size-3' />
                Analytics
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <UserUrlsTable urls={userUrls} />
        </CardContent>
      </Card>
    </div>
  );
}
