'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UrlShortenerForm } from '@/components/urls/url-shortener-form';
import { UserUrlsTable } from '@/components/urls/user-urls-table';
import { AnalyticsTab } from '@/components/dashboard/analytics-tab';
import { BulkShortenTab } from '@/components/dashboard/bulk-shorten-tab';
import { LinkInBioTab } from '@/components/dashboard/link-in-bio-tab';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { getUserUrls, type UserUrl } from '@/server/actions/urls/get-user-urls';

import {
  BarChart3,
  Link2,
  MousePointerClick,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';

export type TabId = 'links' | 'analytics' | 'bulk' | 'bio';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userUrls, setUserUrls] = useState<UserUrl[]>([]);
  const [loading, setLoading] = useState(true);

  const activeTab = (searchParams.get('tab') as TabId) || 'links';

  const fetchUrls = useCallback(async () => {
    if (!session?.user?.id) return;
    const response = await getUserUrls(session.user.id);
    if (response.success && response.data) {
      setUserUrls(response.data);
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
    if (status === 'authenticated') fetchUrls();
  }, [status, fetchUrls]);

  const setTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const totalClicks = userUrls.reduce((sum, u) => sum + u.clicks, 0);
  const topUrl = [...userUrls].sort((a, b) => b.clicks - a.clicks)[0];
  const avgClicks =
    userUrls.length > 0
      ? Math.round((totalClicks / userUrls.length) * 10) / 10
      : 0;

  const firstName = session?.user?.name?.split(' ')[0] ?? '';

  const stats = [
    {
      label: 'Total Links',
      value: userUrls.length,
      icon: <Link2 className='size-4' />,
      accent: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
      change: null,
    },
    {
      label: 'Total Clicks',
      value: totalClicks.toLocaleString(),
      icon: <MousePointerClick className='size-4' />,
      accent: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30',
      change: null,
    },
    {
      label: 'Avg. Clicks',
      value: avgClicks,
      icon: <BarChart3 className='size-4' />,
      accent: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
      change: null,
    },
    {
      label: 'Top Link',
      value: topUrl?.clicks ?? 0,
      icon: <TrendingUp className='size-4' />,
      accent: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30',
      change: topUrl ? topUrl.shortCode : '—',
    },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <div className='flex flex-col items-center gap-3'>
          <Loader2 className='size-8 animate-spin text-violet-600 dark:text-violet-400' />
          <p className='text-sm text-muted-foreground'>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto space-y-6'>

      {/* ── Header ── */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            {firstName ? `Welcome back, ${firstName}!` : 'Welcome back!'}
          </h1>
          <p className='text-muted-foreground text-sm mt-1'>
            Create, manage and track all your shortened links.
          </p>
        </div>
        <button
          onClick={() => setTab('analytics')}
          className='hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-md shadow-violet-500/20'
        >
          <BarChart3 className='size-4' />
          Analytics
          <ArrowUpRight className='size-3.5' />
        </button>
      </div>

      {/* ── Stats grid ── */}
      {userUrls.length > 0 && (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className='p-4 rounded-2xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all duration-200'
            >
              <div className={`inline-flex p-2 rounded-xl mb-3 ${stat.accent}`}>
                {stat.icon}
              </div>
              <p className='text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>
                {stat.value}
              </p>
              <p className='text-xs text-muted-foreground mt-1'>{stat.label}</p>
              {stat.change && (
                <p className='text-xs text-violet-600 dark:text-violet-400 mt-0.5 font-mono truncate'>
                  /{stat.change}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── URL Shortener form ── */}
      <Card className='border-border/60 shadow-sm rounded-2xl overflow-hidden'>
        <CardHeader className='pb-4 border-b border-border/60 bg-muted/20'>
          <div className='flex items-center gap-2'>
            <div className='size-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
              <Sparkles className='size-4' />
            </div>
            <div>
              <CardTitle className='text-base'>Shorten a URL</CardTitle>
              <CardDescription className='text-xs'>
                Paste a long URL — AI safety scans it instantly
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-6'>
          <UrlShortenerForm onSuccess={fetchUrls} />
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <div>
        <DashboardTabs activeTab={activeTab} onTabChange={setTab} linkCount={userUrls.length} />

        <div className='mt-4'>
          {activeTab === 'links' && (
            <Card className='border-border/60 shadow-sm rounded-2xl overflow-hidden'>
              <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='text-base flex items-center gap-2'>
                      <Link2 className='size-4 text-violet-600 dark:text-violet-400' />
                      Your Links
                    </CardTitle>
                    <CardDescription className='text-xs mt-0.5'>
                      {userUrls.length} link{userUrls.length !== 1 ? 's' : ''} created
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => setTab('analytics')}
                    className='text-xs text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 flex items-center gap-1 transition-colors'
                  >
                    <BarChart3 className='size-3' />
                    Analytics
                  </button>
                </div>
              </CardHeader>
              <CardContent className='p-0'>
                <UserUrlsTable urls={userUrls} onRefresh={fetchUrls} />
              </CardContent>
            </Card>
          )}

          {activeTab === 'analytics' && <AnalyticsTab urls={userUrls} />}
          {activeTab === 'bulk' && <BulkShortenTab onSuccess={fetchUrls} />}
          {activeTab === 'bio' && <LinkInBioTab />}
        </div>
      </div>
    </div>
  );
}
