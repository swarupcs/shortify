import { Header } from '@/components/layout/header';
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { ReactNode, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className='min-h-[calc(100vh-64px-56px)]'>
      <Header />
      <div className='container max-w-6xl mx-auto py-10 px-4 md:px-8'>
        <Suspense
          fallback={
            <div className='flex justify-center items-center min-h-[400px]'>
              <div className='flex flex-col items-center gap-3'>
                <Loader2 className='size-8 animate-spin text-violet-600 dark:text-violet-400' />
                <p className='text-sm text-muted-foreground'>Loading…</p>
              </div>
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
