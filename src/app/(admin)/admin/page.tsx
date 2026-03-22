import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminStats } from '@/server/actions/admin/get-admin-stats';
import { AlertTriangle, ArrowRight, Database, Link2Icon, MousePointerClick, TrendingDown, TrendingUp, Users, Activity, Shield } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { AdminActivityChart } from '@/components/admin/admin-activity-chart';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Shortify',
  description: 'Admin dashboard for Shortify',
};

export default async function AdminPage() {
  const statsRes = await getAdminStats();
  const stats = statsRes.data;

  const metricCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers.toLocaleString() ?? '—',
      delta: stats?.newUsersThisWeek,
      deltaLabel: 'new this week',
      icon: <Users className='size-5' />,
      accent: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30',
      href: '/admin/users',
    },
    {
      label: 'Total URLs',
      value: stats?.totalUrls.toLocaleString() ?? '—',
      delta: stats?.newUrlsThisWeek,
      deltaLabel: 'new this week',
      icon: <Link2Icon className='size-5' />,
      accent: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
      href: '/admin/urls',
    },
    {
      label: 'Total Clicks',
      value: stats?.totalClicks.toLocaleString() ?? '—',
      delta: null,
      deltaLabel: 'redirects served',
      icon: <MousePointerClick className='size-5' />,
      accent: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
      href: '/admin/urls',
    },
    {
      label: 'Flagged URLs',
      value: stats?.flaggedUrls.toLocaleString() ?? '—',
      delta: null,
      deltaLabel: 'requires review',
      icon: <AlertTriangle className='size-5' />,
      accent: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
      href: '/admin/urls/flagged',
    },
  ];

  const adminModules = [
    { title: 'URL Management', description: 'View, edit, and manage all shortened URLs', icon: <Link2Icon className='size-5' />, href: '/admin/urls', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-100 dark:bg-violet-900/30' },
    { title: 'Flagged URLs', description: 'Review and moderate flagged URLs', icon: <AlertTriangle className='size-5' />, href: '/admin/urls/flagged', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
    { title: 'User Management', description: 'Manage user accounts and permissions', icon: <Users className='size-5' />, href: '/admin/users', color: 'text-fuchsia-600 dark:text-fuchsia-400', bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/30' },
    { title: 'Audit Log', description: 'View all admin actions and changes', icon: <Activity className='size-5' />, href: '/admin/audit', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Health Monitor', description: 'System status and API usage', icon: <Shield className='size-5' />, href: '/admin/health', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Database Management', description: 'Seed and manage database data', icon: <Database className='size-5' />, href: '/admin/database', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-100 dark:bg-violet-900/30' },
  ];

  return (
    <>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Admin Dashboard</h1>
          <p className='text-muted-foreground text-sm mt-1'>Manage your Shortify application</p>
        </div>
      </div>

      <div className='grid gap-6'>
        {/* ── Live stat cards ── */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
          {metricCards.map((card) => (
            <Link href={card.href} key={card.label}>
              <div className='p-4 rounded-2xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all duration-200 cursor-pointer'>
                <div className={`inline-flex p-2 rounded-xl mb-3 ${card.accent}`}>
                  {card.icon}
                </div>
                <p className='text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>
                  {card.value}
                </p>
                <p className='text-xs text-muted-foreground mt-1'>{card.label}</p>
                {card.delta !== null && card.delta !== undefined && (
                  <div className='flex items-center gap-1 mt-1.5'>
                    {card.delta > 0 ? (
                      <TrendingUp className='size-3 text-emerald-500' />
                    ) : (
                      <TrendingDown className='size-3 text-muted-foreground' />
                    )}
                    <span className='text-xs text-muted-foreground'>
                      +{card.delta} {card.deltaLabel}
                    </span>
                  </div>
                )}
                {card.delta === null && (
                  <p className='text-xs text-muted-foreground mt-1'>{card.deltaLabel}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* ── Activity chart ── */}
        {stats && (stats.urlsPerDay.length > 0 || stats.usersPerDay.length > 0) && (
          <Card className='shadow-sm border-border/60 rounded-2xl'>
            <CardHeader className='pb-3'>
              <div className='flex items-center gap-2'>
                <div className='size-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
                  <Activity className='size-3.5' />
                </div>
                <div>
                  <CardTitle className='text-base'>Platform activity</CardTitle>
                  <CardDescription className='text-xs'>New URLs and users per day — last 14 days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AdminActivityChart
                urlsPerDay={stats.urlsPerDay}
                usersPerDay={stats.usersPerDay}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Module nav cards ── */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          {adminModules.map((module) => (
            <Card key={module.href} className='overflow-hidden border-border/60 hover:border-border hover:shadow-md transition-all duration-200 rounded-2xl'>
              <CardHeader className='pb-2'>
                <div className='flex items-center gap-2'>
                  <div className={`p-2 rounded-xl ${module.bgColor} ${module.color}`}>
                    {module.icon}
                  </div>
                  <CardTitle className='text-lg'>{module.title}</CardTitle>
                </div>
                <CardDescription className='text-sm'>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={module.href}>
                  <Button variant='outline' className='w-full justify-between group border-border/60 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors'>
                    Go to {module.title}
                    <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
