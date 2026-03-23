import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted/60', className)} />;
}

export function AnalyticsSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Summary cards */}
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='p-4 rounded-2xl border border-border/60 bg-card space-y-3'>
            <Skeleton className='size-9 rounded-xl' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-8 w-16' />
            <Skeleton className='h-3.5 w-20' />
          </div>
        ))}
      </div>

      {/* Export bar */}
      <div className='flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card'>
        <div className='space-y-1.5'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-3 w-44' />
        </div>
        <div className='flex gap-2'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-8 w-24 rounded-lg' />
          ))}
        </div>
      </div>

      {/* Chart card */}
      <div className='rounded-2xl border border-border/60 bg-card overflow-hidden'>
        <div className='p-4 border-b border-border/60 bg-muted/20 flex items-center gap-3'>
          <Skeleton className='size-7 rounded-lg' />
          <div className='space-y-1.5'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-3 w-40' />
          </div>
        </div>
        <div className='p-6 space-y-4'>
          {/* Tab bar */}
          <Skeleton className='h-10 w-full rounded-xl' />
          {/* Chart area */}
          <Skeleton className='h-[320px] w-full rounded-xl' />
        </div>
      </div>

      {/* Per-link table */}
      <div className='rounded-2xl border border-border/60 bg-card overflow-hidden'>
        <div className='p-4 border-b border-border/60 bg-muted/20 space-y-1.5'>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-3 w-56' />
        </div>
        <div className='divide-y divide-border/40'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center gap-4 px-4 py-3'>
              <Skeleton className='h-4 w-28 font-mono' />
              <Skeleton className='h-4 flex-1 hidden md:block' />
              <Skeleton className='h-4 w-10 ml-auto' />
              <Skeleton className='h-2 w-16 rounded-full' />
              <Skeleton className='size-7 rounded-lg' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
