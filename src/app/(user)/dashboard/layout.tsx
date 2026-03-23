import { Header } from '@/components/layout/header';
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { ReactNode, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { WithErrorBoundary } from '@/components/error-boundary';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className='min-h-[calc(100vh-64px-56px)]'>
      <Header />
      <div className='container max-w-6xl mx-auto py-10 px-4 md:px-8'>
        <WithErrorBoundary>
          <Suspense fallback={<DashboardSkeleton />}>
            {children}
          </Suspense>
        </WithErrorBoundary>
      </div>
    </div>
  );
}
