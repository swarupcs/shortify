import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  ArrowRight,
  Database,
  Link2Icon,
  Users,
} from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Shortify',
  description: 'Admin dashboard for Shortify',
};

export default function AdminPage() {
  const adminModules = [
    {
      title: 'URL Management',
      description: 'View, edit, and manage all shortened URLs',
      icon: <Link2Icon className='size-5' />,
      href: '/admin/urls',
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    },
    {
      title: 'Flagged URLs',
      description: 'Review and moderate flagged URLs',
      icon: <AlertTriangle className='size-5' />,
      href: '/admin/urls/flagged',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: <Users className='size-5' />,
      href: '/admin/users',
      color: 'text-fuchsia-600 dark:text-fuchsia-400',
      bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    },
    {
      title: 'Database Management',
      description: 'Seed and manage database data',
      icon: <Database className='size-5' />,
      href: '/admin/database',
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    },
  ];

  return (
    <>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Admin Dashboard</h1>
          <p className='text-muted-foreground text-sm mt-1'>
            Manage your Shortify application
          </p>
        </div>
      </div>

      <div className='grid gap-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          {adminModules.map((module) => (
            <Card
              key={module.href}
              className='overflow-hidden border-border/60 hover:border-border hover:shadow-md transition-all duration-200 rounded-2xl'
            >
              <CardHeader className='pb-2'>
                <div className='flex items-center gap-2'>
                  <div
                    className={`p-2 rounded-xl ${module.bgColor} ${module.color}`}
                  >
                    {module.icon}
                  </div>
                  <CardTitle className='text-lg'>{module.title}</CardTitle>
                </div>
                <CardDescription className='text-sm'>
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={module.href}>
                  <Button
                    variant='outline'
                    className='w-full justify-between group border-border/60 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors'
                  >
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
