'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UrlWithUser } from '@/server/actions/admin/urls/get-all-urls';
import { manageFlaggedUrl } from '@/server/actions/admin/urls/manage-flagged-url';
import { bulkManageFlaggedUrls } from '@/server/actions/admin/urls/bulk-manage-flagged-urls';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Ban, CheckCircle, Copy, ExternalLink, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UrlsTableProps {
  urls: UrlWithUser[];
  total: number;
  currentPage: number;
  currentSearch: string;
  currentSortBy: string;
  currentSortOrder: string;
  highlightStyle?: 'security' | 'inappropriate' | 'other' | 'none';
}

export function UrlsTable({ urls, total, currentPage, currentSearch, currentSortBy, currentSortOrder, highlightStyle }: UrlsTableProps) {
  const router = useRouter();
  const [copyingId, setCopyingId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Checkbox selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const headerCheckboxRef = useRef<HTMLButtonElement>(null);

  const basePath = typeof window !== 'undefined' ? window.location.pathname : '/admin/urls';
  const preserveParams = () => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    return params.has('filter') ? `&filter=${params.get('filter')}` : '';
  };

  const limit = 10;
  const totalPage = Math.ceil(total / limit);

  // Reset selection when urls change
  useEffect(() => { setSelectedIds(new Set()); }, [urls]);

  // Indeterminate state on header checkbox
  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (!el) return;
    const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (!input) return;
    input.indeterminate = selectedIds.size > 0 && selectedIds.size < urls.length;
  }, [selectedIds, urls.length]);

  const toggleAll = () => {
    if (selectedIds.size === urls.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(urls.map((u) => u.id)));
    }
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSort = (column: string) => {
    const params = new URLSearchParams();
    if (currentSearch) params.set('search', currentSearch);
    params.set('sortBy', column);
    params.set('sortOrder', currentSortBy === column ? (currentSortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
    params.set('page', '1');
    router.push(`${basePath}?${params.toString()}`);
  };

  const getSortIcon = (col: string) => {
    if (currentSortBy !== col) return <ArrowUpDown className='ml-2 size-4' />;
    return currentSortOrder === 'asc' ? <ArrowUp className='ml-2 size-4' /> : <ArrowDown className='ml-2 size-4' />;
  };

  const getHighlightStyles = (url: UrlWithUser) => {
    if (!url.flagged) return '';
    switch (highlightStyle) {
      case 'security': return 'bg-red-50/50 dark:bg-red-900/10';
      case 'inappropriate': return 'bg-orange-50/50 dark:bg-orange-900/10';
      case 'other': return 'bg-yellow-50/50 dark:bg-yellow-900/10';
      default: return 'bg-yellow-50/50 dark:bg-yellow-900/10';
    }
  };

  const getFlagIconColor = () => {
    switch (highlightStyle) {
      case 'security': return 'text-red-500';
      case 'inappropriate': return 'text-orange-500';
      case 'other': return 'text-yellow-500';
      default: return 'text-yellow-600';
    }
  };

  const truncateUrl = (url: string, max = 50) =>
    url.length <= max ? url : url.substring(0, max) + '...';

  const handleManage = async (urlId: number, action: 'approve' | 'delete') => {
    try {
      setActionLoading(urlId);
      const response = await manageFlaggedUrl(urlId, action);
      if (response.success) {
        toast.success(action === 'approve' ? 'URL approved.' : 'URL deleted.');
        router.refresh();
      } else {
        toast.error('Failed.', { description: response.error ?? 'Unknown error' });
      }
    } catch {
      toast.error('Failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'delete') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const label = action === 'approve' ? 'Approve' : 'Delete';
    if (!confirm(`${label} ${ids.length} selected URL${ids.length !== 1 ? 's' : ''}?`)) return;

    setBulkLoading(true);
    try {
      const response = await bulkManageFlaggedUrls(ids, action);
      if (response.success) {
        toast.success(`${label}d ${response.data?.processed} URL${(response.data?.processed ?? 0) !== 1 ? 's' : ''}.`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error('Bulk action failed.', { description: response.error });
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setBulkLoading(false);
    }
  };

  const copyToClipboard = async (id: number, shortCode: string) => {
    try {
      setCopyingId(id);
      await navigator.clipboard.writeText(`${window.location.origin}/r/${shortCode}`);
      toast.success('Copied.');
    } catch {
      toast.error('Failed to copy.');
    } finally {
      setTimeout(() => setCopyingId(null), 1000);
    }
  };

  const getPaginationItems = () => {
    const items = [];
    const ap = preserveParams();
    const base = `${basePath}?${currentSearch ? `&search=${currentSearch}` : ''}${currentSortBy ? `&sortBy=${currentSortBy}&sortOrder=${currentSortOrder}` : ''}${ap}`;
    items.push(<PaginationItem key='first'><PaginationLink href={`${basePath}?page=1${base.replace(`${basePath}?`, '&')}`} isActive={currentPage === 1}>1</PaginationLink></PaginationItem>);
    if (currentPage > 3) items.push(<PaginationItem key='e1'><PaginationEllipsis /></PaginationItem>);
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPage - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPage) continue;
      items.push(<PaginationItem key={i}><PaginationLink href={`${basePath}?page=${i}${base.replace(`${basePath}?`, '&')}`} isActive={currentPage === i}>{i}</PaginationLink></PaginationItem>);
    }
    if (currentPage < totalPage - 2) items.push(<PaginationItem key='e2'><PaginationEllipsis /></PaginationItem>);
    if (totalPage > 1) items.push(<PaginationItem key='last'><PaginationLink href={`${basePath}?page=${totalPage}${base.replace(`${basePath}?`, '&')}`} isActive={currentPage === totalPage}>{totalPage}</PaginationLink></PaginationItem>);
    return items;
  };

  const flaggedSelected = urls.filter((u) => u.flagged && selectedIds.has(u.id));

  return (
    <div className='space-y-4'>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-10'>
                <Checkbox
                  ref={headerCheckboxRef}
                  checked={selectedIds.size === urls.length && urls.length > 0}
                  onCheckedChange={toggleAll}
                  aria-label='Select all'
                />
              </TableHead>
              <TableHead className='w-[280px]'><button className='flex items-center font-medium' onClick={() => handleSort('originalUrl')}>Original URL{getSortIcon('originalUrl')}</button></TableHead>
              <TableHead className='w-[140px]'><button className='flex items-center font-medium' onClick={() => handleSort('shortCode')}>Short Code{getSortIcon('shortCode')}</button></TableHead>
              <TableHead className='w-[90px]'><button className='flex items-center font-medium' onClick={() => handleSort('clicks')}>Clicks{getSortIcon('clicks')}</button></TableHead>
              <TableHead className='w-[150px]'><button className='flex items-center font-medium' onClick={() => handleSort('userName')}>Created By{getSortIcon('userName')}</button></TableHead>
              <TableHead className='w-[140px]'><button className='flex items-center font-medium' onClick={() => handleSort('createdAt')}>Created{getSortIcon('createdAt')}</button></TableHead>
              <TableHead className='w-[80px] text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {urls.length === 0 ? (
              <TableRow><TableCell colSpan={7} className='h-24 text-center text-muted-foreground'>{currentSearch ? 'No URLs found with the search term.' : 'No URLs found.'}</TableCell></TableRow>
            ) : urls.map((url) => (
              <TableRow key={url.id} className={cn(getHighlightStyles(url), selectedIds.has(url.id) && 'bg-violet-50/50 dark:bg-violet-900/10')}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(url.id)}
                    onCheckedChange={() => toggleOne(url.id)}
                    aria-label={`Select ${url.shortCode}`}
                  />
                </TableCell>
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-2'>
                    {url.flagged && <div className={getFlagIconColor()} title={url.flagReason ?? 'Flagged'}><AlertTriangle className='size-4' /></div>}
                    <a href={url.originalUrl} target='_blank' rel='noopener noreferrer' className='text-blue-600 hover:underline flex items-center gap-1 max-w-[240px] truncate'>
                      {truncateUrl(url.originalUrl)}<ExternalLink className='size-3 shrink-0' />
                    </a>
                  </div>
                  {url.flagged && url.flagReason && (
                    <div className='mt-1 text-xs text-yellow-600 dark:text-yellow-400 max-w-[240px] truncate'>Reason: {url.flagReason}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <code className='bg-muted px-1 py-0.5 rounded text-sm'>{url.shortCode}</code>
                    <Button variant='ghost' size='icon' className='size-6' onClick={() => copyToClipboard(url.id, url.shortCode)} disabled={copyingId === url.id}>
                      {copyingId === url.id ? <Loader2 className='size-3 animate-spin' /> : <Copy className='size-3' />}
                    </Button>
                  </div>
                </TableCell>
                <TableCell><Badge variant='secondary'>{url.clicks}</Badge></TableCell>
                <TableCell>
                  {url.userId ? (
                    <div className='flex items-center gap-2'>
                      <Avatar className='size-6'><AvatarImage src={undefined} alt={url.userName ?? 'User'} /><AvatarFallback className='text-xs'>{url.userName?.substring(0, 2)}</AvatarFallback></Avatar>
                      <span className='truncate max-w-[100px]'>{url.userName ?? url.userEmail ?? 'Unknown'}</span>
                    </div>
                  ) : <span className='text-muted-foreground text-sm'>Anonymous</span>}
                </TableCell>
                <TableCell>{formatDistanceToNow(new Date(url.createdAt), { addSuffix: true })}</TableCell>
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant='ghost' size='icon'><MoreHorizontal className='size-4' /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => copyToClipboard(url.id, url.shortCode)}>Copy Short URL</DropdownMenuItem>
                      <DropdownMenuItem asChild><a href={url.originalUrl} target='_blank' rel='noopener noreferrer'>Visit Original URL</a></DropdownMenuItem>
                      {url.flagged && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className='text-green-600 dark:text-green-400' onClick={() => handleManage(url.id, 'approve')}>
                            {actionLoading === url.id && <Loader2 className='size-4 mr-1 animate-spin' />}
                            <CheckCircle className='size-4 mr-1 text-green-700' />Approve URL
                          </DropdownMenuItem>
                          <DropdownMenuItem className='text-red-600 dark:text-red-400' onClick={() => handleManage(url.id, 'delete')}>
                            {actionLoading === url.id && <Loader2 className='size-4 mr-1 animate-spin' />}
                            <Ban className='size-4 mr-1 text-red-700' />Delete URL
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Bulk action bar ── */}
      {selectedIds.size > 0 && (
        <div className='flex items-center justify-between p-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 animate-fade-up'>
          <span className='text-sm font-medium text-violet-700 dark:text-violet-300'>
            {selectedIds.size} URL{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' className='gap-1.5 text-xs' onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
            {flaggedSelected.length > 0 && (
              <>
                <Button
                  size='sm'
                  className='gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0'
                  disabled={bulkLoading}
                  onClick={() => handleBulkAction('approve')}
                >
                  {bulkLoading ? <Loader2 className='size-3 animate-spin' /> : <CheckCircle className='size-3' />}
                  Approve {flaggedSelected.length}
                </Button>
                <Button
                  size='sm'
                  className='gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white border-0'
                  disabled={bulkLoading}
                  onClick={() => handleBulkAction('delete')}
                >
                  {bulkLoading ? <Loader2 className='size-3 animate-spin' /> : <Trash2 className='size-3' />}
                  Delete {flaggedSelected.length}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {totalPage > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious href={`${basePath}?page=${Math.max(1, currentPage - 1)}${currentSearch ? `&search=${currentSearch}` : ''}${currentSortBy ? `&sortBy=${currentSortBy}&sortOrder=${currentSortOrder}` : ''}${preserveParams()}`} /></PaginationItem>
            {getPaginationItems()}
            <PaginationItem><PaginationNext href={`${basePath}?page=${Math.min(totalPage, currentPage + 1)}${currentSearch ? `&search=${currentSearch}` : ''}${currentSortBy ? `&sortBy=${currentSortBy}&sortOrder=${currentSortOrder}` : ''}${preserveParams()}`} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <div className='text-xs text-muted-foreground'>Showing {urls.length} of {total} URLs.{currentSearch && ` Search results for "${currentSearch}".`}</div>
    </div>
  );
}
