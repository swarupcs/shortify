import { getAuditLogs } from '@/server/actions/admin/audit-log';
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Activity,
  ArrowLeft,
  CheckCircle,
  Trash2,
  UserCog,
  Database,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Audit Log | Admin | Shortify',
};

type Params = { searchParams: Promise<{ page?: string; filter?: string }> };

// Typed metadata shape — extend as needed
type AuditMetadata = {
  shortCode?: string;
  previousRole?: string;
  newRole?: string;
  userEmail?: string;
  bulk?: boolean;
  count?: number;
  flagReason?: string;
};

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  URL_APPROVED: {
    label: 'URL approved',
    icon: <CheckCircle className='size-3.5' />,
    className:
      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  },
  URL_DELETED: {
    label: 'URL deleted',
    icon: <Trash2 className='size-3.5' />,
    className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
  USER_ROLE_CHANGED: {
    label: 'Role changed',
    icon: <UserCog className='size-3.5' />,
    className:
      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  },
  DATABASE_SEEDED: {
    label: 'DB seeded',
    icon: <Database className='size-3.5' />,
    className:
      'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  },
};

function ActionBadge({ action }: { action: string }) {
  const config = ACTION_CONFIG[action] ?? {
    label: action,
    icon: <Activity className='size-3.5' />,
    className: 'bg-muted text-muted-foreground',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
        config.className,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

export default async function AuditPage({ searchParams }: Params) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'admin') redirect('/dashboard');

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const filter = (params.filter ?? 'all') as 'all' | 'url' | 'user';

  const response = await getAuditLogs({ page, limit: 20, filter });
  const logs = response.data?.logs ?? [];
  const total = response.data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const filters: { id: string; label: string }[] = [
    { id: 'all', label: 'All actions' },
    { id: 'url', label: 'URL actions' },
    { id: 'user', label: 'User actions' },
  ];

  return (
    <>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='size-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400'>
            <Activity className='size-5' />
          </div>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Audit Log</h1>
            <p className='text-muted-foreground text-sm mt-0.5'>
              {total} total actions recorded
            </p>
          </div>
        </div>
        <Link href='/admin'>
          <Button variant='outline' size='sm' className='gap-2'>
            <ArrowLeft className='size-4' />
            Back to Admin
          </Button>
        </Link>
      </div>

      <Card className='shadow-sm border-border/60 rounded-2xl'>
        <CardHeader className='pb-3 border-b border-border/60'>
          <div className='flex gap-2 flex-wrap'>
            {filters.map((f) => (
              <Link key={f.id} href={`/admin/audit?filter=${f.id}&page=1`}>
                <Button
                  variant={filter === f.id ? 'default' : 'outline'}
                  size='sm'
                  className={
                    filter === f.id
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0'
                      : 'border-border/60'
                  }
                >
                  {f.label}
                </Button>
              </Link>
            ))}
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          {logs.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-16 text-center'>
              <div className='size-12 rounded-xl bg-muted flex items-center justify-center mb-3'>
                <Activity className='size-5 text-muted-foreground' />
              </div>
              <p className='font-medium mb-1'>No audit logs yet</p>
              <p className='text-sm text-muted-foreground'>
                Admin actions will appear here once they&apos;re performed.
              </p>
            </div>
          ) : (
            <div className='divide-y divide-border/40'>
              {logs.map((log) => {
                // Cast once here — metadata comes back as `unknown` from the DB
                const meta = (log.metadata ?? {}) as AuditMetadata;
                const hasMetadata = Object.keys(meta).length > 0;

                return (
                  <div
                    key={log.id}
                    className='flex items-start gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors'
                  >
                    {/* Actor avatar */}
                    <Avatar className='size-8 shrink-0 mt-0.5'>
                      <AvatarImage src={log.actorImage ?? undefined} />
                      <AvatarFallback className='text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'>
                        {log.actorName?.charAt(0)?.toUpperCase() ?? 'A'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-sm font-medium truncate'>
                          {log.actorName ?? log.actorEmail ?? 'Unknown admin'}
                        </span>
                        <ActionBadge action={log.action} />
                      </div>

                      {/* Metadata details */}
                      {hasMetadata && (
                        <div className='mt-1 flex flex-wrap gap-x-3 gap-y-0.5'>
                          {meta.shortCode && (
                            <span className='text-xs text-muted-foreground font-mono'>
                              /{meta.shortCode}
                            </span>
                          )}
                          {meta.previousRole && meta.newRole && (
                            <span className='text-xs text-muted-foreground'>
                              {meta.previousRole} → {meta.newRole}
                            </span>
                          )}
                          {meta.userEmail && (
                            <span className='text-xs text-muted-foreground'>
                              {meta.userEmail}
                            </span>
                          )}
                          {meta.bulk && meta.count && (
                            <span className='text-xs text-muted-foreground'>
                              {meta.count} URLs (bulk)
                            </span>
                          )}
                          {meta.flagReason && (
                            <span className='text-xs text-amber-600 dark:text-amber-400'>
                              Reason: {meta.flagReason}
                            </span>
                          )}
                        </div>
                      )}
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        Target:{' '}
                        <span className='font-mono'>
                          {log.targetType}/
                          {log.targetId.length > 20
                            ? log.targetId.substring(0, 20) + '…'
                            : log.targetId}
                        </span>
                      </p>
                    </div>

                    {/* Time */}
                    <span className='text-xs text-muted-foreground shrink-0 mt-0.5'>
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='border-t border-border/60 px-4 py-3'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={`/admin/audit?filter=${filter}&page=${Math.max(1, page - 1)}`}
                  />
                </PaginationItem>
                {Array.from(
                  { length: Math.min(totalPages, 5) },
                  (_, i) => i + 1,
                ).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href={`/admin/audit?filter=${filter}&page=${p}`}
                      isActive={page === p}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href={`/admin/audit?filter=${filter}&page=${Math.min(totalPages, page + 1)}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>
    </>
  );
}
