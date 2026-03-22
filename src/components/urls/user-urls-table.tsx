'use client';

import {
  Copy,
  Edit,
  ExternalLink,
  QrCode,
  Trash2Icon,
  Check,
  LinkIcon,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { deleteUrl } from '@/server/actions/urls/delete-url';
import { QRCodeModal } from '../modals/qr-code-modal';
import { EditUrlModal } from '../modals/edit-url-modal';
import { BASEURL } from '@/lib/const';
import { cn } from '@/lib/utils';

interface Url {
  id: number;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clicks: number;
}

interface UserUrlsTableProps {
  urls: Url[];
  onRefresh?: () => void;
}

type SortField = 'shortCode' | 'clicks' | 'createdAt' | 'originalUrl';
type SortOrder = 'asc' | 'desc';

export function UserUrlsTable({ urls, onRefresh }: UserUrlsTableProps) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [localUrls, setLocalUrls] = useState<Url[]>(urls);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrCodeShortCode, setQrCodeShortCode] = useState<string>('');
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [urlToEdit, setUrlToEdit] = useState<{
    id: number;
    shortCode: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Search & sort state
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const baseUrl = BASEURL;

  // Keep localUrls in sync when parent re-fetches
  useMemo(() => {
    setLocalUrls(urls);
  }, [urls]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className='size-3.5 opacity-40' />;
    return sortOrder === 'asc' ? (
      <ArrowUp className='size-3.5' />
    ) : (
      <ArrowDown className='size-3.5' />
    );
  };

  const filteredAndSorted = useMemo(() => {
    let filtered = localUrls;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.shortCode.toLowerCase().includes(q) ||
          u.originalUrl.toLowerCase().includes(q),
      );
    }

    return [...filtered].sort((a, b) => {
      let vA: string | number | Date;
      let vB: string | number | Date;

      switch (sortField) {
        case 'shortCode':
          vA = a.shortCode;
          vB = b.shortCode;
          break;
        case 'clicks':
          vA = a.clicks;
          vB = b.clicks;
          break;
        case 'createdAt':
          vA = a.createdAt;
          vB = b.createdAt;
          break;
        case 'originalUrl':
          vA = a.originalUrl;
          vB = b.originalUrl;
          break;
        default:
          return 0;
      }

      if (typeof vA === 'string' && typeof vB === 'string') {
        return sortOrder === 'asc'
          ? vA.localeCompare(vB)
          : vB.localeCompare(vA);
      }

      if (vA < vB) return sortOrder === 'asc' ? -1 : 1;
      if (vA > vB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [localUrls, search, sortField, sortOrder]);

  const copyToClipboard = async (id: number, shortCode: string) => {
    try {
      await navigator.clipboard.writeText(`${baseUrl}/r/${shortCode}`);
      setCopiedId(id);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    try {
      const response = await deleteUrl(id);
      if (response.success) {
        // Optimistic removal — no router.refresh() needed
        setLocalUrls((prev) => prev.filter((url) => url.id !== id));
        toast.success('Link deleted');
        onRefresh?.();
      } else {
        toast.error('Failed to delete', { description: response.error });
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(null);
    }
  };

  const showQrCode = (shortCode: string) => {
    setQrCodeUrl(`${baseUrl}/r/${shortCode}`);
    setQrCodeShortCode(shortCode);
    setIsQrCodeModalOpen(true);
  };

  const handleEdit = (id: number, shortCode: string) => {
    setUrlToEdit({ id, shortCode });
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (newShortCode: string) => {
    if (!urlToEdit) return;
    setLocalUrls((prev) =>
      prev.map((url) =>
        url.id === urlToEdit.id ? { ...url, shortCode: newShortCode } : url,
      ),
    );
  };

  if (localUrls.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
        <div className='size-14 rounded-2xl bg-muted flex items-center justify-center mb-4'>
          <LinkIcon className='size-6 text-muted-foreground' />
        </div>
        <h3 className='font-semibold mb-2'>No links yet</h3>
        <p className='text-sm text-muted-foreground max-w-xs'>
          Create your first shortened link using the form above.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Search bar */}
      <div className='px-4 py-3 border-b border-border/60'>
        <div className='relative max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search links…'
            className='pl-8 pr-8 h-8 text-sm border-border/60 focus-visible:ring-violet-500/20 focus-visible:border-violet-400'
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
            >
              <X className='size-3.5' />
            </button>
          )}
        </div>
        {search && (
          <p className='text-xs text-muted-foreground mt-1.5'>
            {filteredAndSorted.length} result
            {filteredAndSorted.length !== 1 ? 's' : ''} for &ldquo;{search}
            &rdquo;
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className='hidden md:block overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-border/60'>
              <th className='text-left px-4 py-3'>
                <button
                  onClick={() => handleSort('originalUrl')}
                  className='flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors'
                >
                  Original URL
                  <SortIcon field='originalUrl' />
                </button>
              </th>
              <th className='text-left px-4 py-3'>
                <button
                  onClick={() => handleSort('shortCode')}
                  className='flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors'
                >
                  Short Link
                  <SortIcon field='shortCode' />
                </button>
              </th>
              <th className='text-left px-4 py-3'>
                <button
                  onClick={() => handleSort('clicks')}
                  className='flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors'
                >
                  Clicks
                  <SortIcon field='clicks' />
                </button>
              </th>
              <th className='text-left px-4 py-3'>
                <button
                  onClick={() => handleSort('createdAt')}
                  className='flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors'
                >
                  Created
                  <SortIcon field='createdAt' />
                </button>
              </th>
              <th className='text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-32'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border/40'>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className='px-4 py-10 text-center text-sm text-muted-foreground'
                >
                  No links match &ldquo;{search}&rdquo;
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((url) => (
                <tr
                  key={url.id}
                  className='group hover:bg-muted/30 transition-colors'
                >
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-2 max-w-xs'>
                      <span
                        className='text-sm text-muted-foreground truncate'
                        title={url.originalUrl}
                      >
                        {url.originalUrl}
                      </span>
                      <a
                        href={url.originalUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100'
                      >
                        <ExternalLink className='size-3.5' />
                      </a>
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <span className='font-mono text-sm font-medium text-violet-600 dark:text-violet-400'>
                      /r/{url.shortCode}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground'>
                      {url.clicks}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-sm text-muted-foreground'>
                    {formatDistanceToNow(new Date(url.createdAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className={cn(
                          'size-7 transition-colors',
                          copiedId === url.id
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                        onClick={() => copyToClipboard(url.id, url.shortCode)}
                      >
                        {copiedId === url.id ? (
                          <Check className='size-3.5' />
                        ) : (
                          <Copy className='size-3.5' />
                        )}
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7 text-muted-foreground hover:text-foreground'
                        onClick={() => showQrCode(url.shortCode)}
                      >
                        <QrCode className='size-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7 text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400'
                        onClick={() => handleEdit(url.id, url.shortCode)}
                      >
                        <Edit className='size-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7 text-muted-foreground hover:text-destructive'
                        onClick={() => handleDelete(url.id)}
                        disabled={isDeleting === url.id}
                      >
                        {isDeleting === url.id ? (
                          <span className='size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent' />
                        ) : (
                          <Trash2Icon className='size-3.5' />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className='md:hidden divide-y divide-border/40'>
        {filteredAndSorted.length === 0 ? (
          <div className='p-6 text-center text-sm text-muted-foreground'>
            No links match &ldquo;{search}&rdquo;
          </div>
        ) : (
          filteredAndSorted.map((url) => (
            <div key={url.id} className='p-4 space-y-3'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex-1 min-w-0'>
                  <p className='font-mono text-sm font-semibold text-violet-600 dark:text-violet-400 truncate'>
                    /r/{url.shortCode}
                  </p>
                  <p className='text-xs text-muted-foreground truncate mt-0.5'>
                    {url.originalUrl}
                  </p>
                </div>
                <span className='shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground'>
                  {url.clicks} clicks
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='flex-1 h-8 text-xs'
                  onClick={() => copyToClipboard(url.id, url.shortCode)}
                >
                  {copiedId === url.id ? (
                    <>
                      <Check className='size-3 mr-1' />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className='size-3 mr-1' />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  onClick={() => showQrCode(url.shortCode)}
                >
                  <QrCode className='size-3.5' />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  onClick={() => handleEdit(url.id, url.shortCode)}
                >
                  <Edit className='size-3.5' />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8 text-destructive border-destructive/20 hover:bg-destructive/10'
                  onClick={() => handleDelete(url.id)}
                  disabled={isDeleting === url.id}
                >
                  <Trash2Icon className='size-3.5' />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <QRCodeModal
        isOpen={isQrCodeModalOpen}
        onOpenChange={setIsQrCodeModalOpen}
        url={qrCodeUrl}
        shortCode={qrCodeShortCode}
      />
      {urlToEdit && (
        <EditUrlModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          urlId={urlToEdit.id}
          currentShortCode={urlToEdit.shortCode}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
