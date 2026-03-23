import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-muted/60', className)} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-7 w-56' />
          <Skeleton className='h-4 w-72' />
        </div>
        <Skeleton className='h-9 w-28 rounded-xl' />
      </div>

      {/* Stats grid */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='p-4 rounded-2xl border border-border/60 bg-card space-y-3'>
            <Skeleton className='size-9 rounded-xl' />
            <Skeleton className='h-7 w-16' />
            <Skeleton className='h-3.5 w-24' />
          </div>
        ))}
      </div>

      {/* Shortener form */}
      <div className='rounded-2xl border border-border/60 bg-card overflow-hidden'>
        <div className='p-4 border-b border-border/60 bg-muted/20 flex items-center gap-3'>
          <Skeleton className='size-8 rounded-lg' />
          <div className='space-y-1.5'>
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-3 w-48' />
          </div>
        </div>
        <div className='p-6'>
          <Skeleton className='h-11 w-full rounded-2xl' />
        </div>
      </div>

      {/* Tabs */}
      <Skeleton className='h-10 w-full rounded-xl' />

      {/* Table */}
      <TableSkeleton />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className='rounded-2xl border border-border/60 bg-card overflow-hidden'>
      {/* Table header */}
      <div className='px-4 py-3 border-b border-border/60 bg-muted/20'>
        <Skeleton className='h-8 w-48 rounded-lg' />
      </div>
      {/* Rows */}
      <div className='divide-y divide-border/40'>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className='flex items-center gap-4 px-4 py-3.5'>
            <Skeleton className='size-4 rounded' />
            <Skeleton className='h-4 flex-1 max-w-xs' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-5 w-16 rounded-full' />
            <Skeleton className='h-4 w-12' />
            <Skeleton className='h-4 w-20 ml-auto' />
          </div>
        ))}
      </div>
    </div>
  );
}
