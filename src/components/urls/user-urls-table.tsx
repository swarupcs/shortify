'use client';

import {
  Copy, Edit, ExternalLink, QrCode, Trash2Icon, Check,
  LinkIcon, Search, X, ArrowUpDown, ArrowUp, ArrowDown,
  AlertTriangle, Clock, Lock, CheckCircle2, LockOpen, Loader2,
} from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { toast } from 'sonner';
import { deleteUrl } from '@/server/actions/urls/delete-url';
import { bulkDeleteUrls } from '@/server/actions/urls/bulk-delete-urls';
import { toggleUrlPassword } from '@/server/actions/urls/toggle-url-password';
import { QRCodeModal } from '../modals/qr-code-modal';
import { EditUrlModal } from '../modals/edit-url-modal';
import { BASEURL } from '@/lib/const';
import { cn } from '@/lib/utils';
import type { UserUrl } from '@/server/actions/urls/get-user-urls';

interface UserUrlsTableProps {
  urls: UserUrl[];
  onRefresh?: () => void;
}

type SortField = 'shortCode' | 'clicks' | 'createdAt' | 'originalUrl';
type SortOrder = 'asc' | 'desc';
type UrlStatus = 'active' | 'flagged' | 'expired' | 'protected';

// ── Status helpers ────────────────────────────────────────────────────────

function getUrlStatus(url: UserUrl): UrlStatus {
  if (url.flagged) return 'flagged';
  if (url.expiresAt && isPast(new Date(url.expiresAt))) return 'expired';
  if (url.passwordProtected) return 'protected';
  return 'active';
}

const STATUS_CONFIG: Record<UrlStatus, { label: string; icon: React.ReactNode; className: string }> = {
  active: {
    label: 'Active',
    icon: <CheckCircle2 className='size-3' />,
    className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  flagged: {
    label: 'Flagged',
    icon: <AlertTriangle className='size-3' />,
    className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  expired: {
    label: 'Expired',
    icon: <Clock className='size-3' />,
    className: 'bg-muted text-muted-foreground border-border/60',
  },
  protected: {
    label: 'Protected',
    icon: <Lock className='size-3' />,
    className: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  },
};

function StatusBadge({ url }: { url: UserUrl }) {
  const config = STATUS_CONFIG[getUrlStatus(url)];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', config.className)}>
      {config.icon}{config.label}
    </span>
  );
}

// ── Expiry badge ──────────────────────────────────────────────────────────

function ExpiryBadge({ expiresAt }: { expiresAt: Date | null }) {
  if (!expiresAt) return null;
  const expired = isPast(new Date(expiresAt));
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
      expired
        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    )}>
      <Clock className='size-3' />
      {expired ? 'Expired' : `Expires ${format(new Date(expiresAt), 'MMM d, yyyy')}`}
    </span>
  );
}

// ── Password toggle modal ─────────────────────────────────────────────────

function PasswordToggleModal({
  url,
  onClose,
  onSuccess,
}: {
  url: UserUrl;
  onClose: () => void;
  onSuccess: (urlId: number, passwordProtected: boolean) => void;
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isProtected = !!url.passwordProtected;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await toggleUrlPassword(url.id, isProtected ? null : password);
      if (result.success && result.data) {
        toast.success(result.data.passwordProtected ? 'Password protection enabled' : 'Password protection removed');
        onSuccess(url.id, result.data.passwordProtected);
        onClose();
      } else {
        toast.error('Failed', { description: result.error });
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
      <div className='bg-background rounded-2xl border border-border/60 shadow-xl w-full max-w-sm p-6'>
        <h2 className='text-base font-semibold mb-1'>
          {isProtected ? 'Remove password protection' : 'Add password protection'}
        </h2>
        <p className='text-sm text-muted-foreground mb-4'>
          {isProtected
            ? 'Anyone with the link will be able to access it without a password.'
            : 'Visitors will need to enter this password to access the link.'}
        </p>

        <form onSubmit={handleSubmit} className='space-y-3'>
          {!isProtected && (
            <div className='relative'>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter a password…'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className='h-10 pr-9 rounded-xl'
                autoFocus
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                tabIndex={-1}
              >
                {showPassword ? <LockOpen className='size-4' /> : <Lock className='size-4' />}
              </button>
            </div>
          )}

          <div className='flex gap-2'>
            <Button type='button' variant='outline' className='flex-1' onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isLoading || (!isProtected && !password.trim())}
              className={cn(
                'flex-1 text-white border-0',
                isProtected
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700',
              )}
            >
              {isLoading
                ? <Loader2 className='size-4 animate-spin' />
                : isProtected ? 'Remove protection' : 'Set password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main table ────────────────────────────────────────────────────────────

export function UserUrlsTable({ urls, onRefresh }: UserUrlsTableProps) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [localUrls, setLocalUrls] = useState<UserUrl[]>(urls);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [passwordToggleUrl, setPasswordToggleUrl] = useState<UserUrl | null>(null);

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeShortCode, setQrCodeShortCode] = useState('');
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [urlToEdit, setUrlToEdit] = useState<{ id: number; shortCode: string } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const headerCheckboxRef = useRef<HTMLButtonElement>(null);
  const baseUrl = BASEURL;

  useMemo(() => { setLocalUrls(urls); }, [urls]);

  // Reset selection when urls change
  useEffect(() => { setSelectedIds(new Set()); }, [urls]);

  // Indeterminate state on header checkbox
  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (!el) return;
    const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (!input) return;
    input.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredAndSorted.length;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortOrder('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className='size-3.5 opacity-40' />;
    return sortOrder === 'asc' ? <ArrowUp className='size-3.5' /> : <ArrowDown className='size-3.5' />;
  };

  const filteredAndSorted = useMemo(() => {
    let filtered = localUrls;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) => u.shortCode.toLowerCase().includes(q) || u.originalUrl.toLowerCase().includes(q),
      );
    }
    return [...filtered].sort((a, b) => {
      let vA: string | number | Date;
      let vB: string | number | Date;
      switch (sortField) {
        case 'shortCode':   vA = a.shortCode;   vB = b.shortCode;   break;
        case 'clicks':      vA = a.clicks;       vB = b.clicks;       break;
        case 'createdAt':   vA = a.createdAt;    vB = b.createdAt;    break;
        case 'originalUrl': vA = a.originalUrl;  vB = b.originalUrl;  break;
        default: return 0;
      }
      if (typeof vA === 'string' && typeof vB === 'string')
        return sortOrder === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
      if (vA < vB) return sortOrder === 'asc' ? -1 : 1;
      if (vA > vB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [localUrls, search, sortField, sortOrder]);

  const toggleAll = () => {
    if (selectedIds.size === filteredAndSorted.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredAndSorted.map((u) => u.id)));
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (id: number, shortCode: string) => {
    try {
      await navigator.clipboard.writeText(`${baseUrl}/r/${shortCode}`);
      setCopiedId(id);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch { toast.error('Failed to copy'); }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    try {
      const response = await deleteUrl(id);
      if (response.success) {
        setLocalUrls((prev) => prev.filter((u) => u.id !== id));
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        toast.success('Link deleted');
        onRefresh?.();
      } else {
        toast.error('Failed to delete', { description: response.error });
      }
    } catch { toast.error('An error occurred'); }
    finally { setIsDeleting(null); }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} link${ids.length !== 1 ? 's' : ''}? This can be undone by an admin.`)) return;

    setIsBulkDeleting(true);
    try {
      const result = await bulkDeleteUrls(ids);
      if (result.success && result.data) {
        setLocalUrls((prev) => prev.filter((u) => !ids.includes(u.id)));
        setSelectedIds(new Set());
        toast.success(`Deleted ${result.data.deleted} link${result.data.deleted !== 1 ? 's' : ''}`);
        onRefresh?.();
      } else {
        toast.error('Bulk delete failed', { description: result.error });
      }
    } catch { toast.error('An error occurred'); }
    finally { setIsBulkDeleting(false); }
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
      prev.map((u) => u.id === urlToEdit.id ? { ...u, shortCode: newShortCode } : u),
    );
  };

  const handlePasswordToggleSuccess = (urlId: number, passwordProtected: boolean) => {
    setLocalUrls((prev) =>
      prev.map((u) => u.id === urlId
        ? { ...u, passwordProtected }
        : u,
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
      {/* Search */}
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
            <button onClick={() => setSearch('')} className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'>
              <X className='size-3.5' />
            </button>
          )}
        </div>
        {search && (
          <p className='text-xs text-muted-foreground mt-1.5'>
            {filteredAndSorted.length} result{filteredAndSorted.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className='hidden md:block overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-border/60'>
              <th className='px-4 py-3 w-10'>
                <Checkbox
                  ref={headerCheckboxRef}
                  checked={selectedIds.size === filteredAndSorted.length && filteredAndSorted.length > 0}
                  onCheckedChange={toggleAll}
                  aria-label='Select all'
                />
              </th>
              <th className='text-left px-4 py-3'>
                <button onClick={() => handleSort('originalUrl')} className='flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors'>
                  Original URL <SortIcon field='originalUrl' />
                </button>
              </th>
              <th className='text-left px-4 py-3'>
                <button onClick={() => handleSort('shortCode')} className='flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors'>
                  Short Link <SortIcon field='shortCode' />
                </button>
              </th>
              <th className='text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide'>Status</th>
              <th className='text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide'>Expiry</th>
              <th className='text-left px-4 py-3'>
                <button onClick={() => handleSort('clicks')} className='flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors'>
                  Clicks <SortIcon field='clicks' />
                </button>
              </th>
              <th className='text-left px-4 py-3'>
                <button onClick={() => handleSort('createdAt')} className='flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors'>
                  Created <SortIcon field='createdAt' />
                </button>
              </th>
              <th className='text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-36'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border/40'>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={8} className='px-4 py-10 text-center text-sm text-muted-foreground'>
                  No links match &ldquo;{search}&rdquo;
                </td>
              </tr>
            ) : filteredAndSorted.map((url) => (
              <tr key={url.id} className={cn('group hover:bg-muted/30 transition-colors', selectedIds.has(url.id) && 'bg-violet-50/50 dark:bg-violet-900/10')}>
                <td className='px-4 py-3'>
                  <Checkbox
                    checked={selectedIds.has(url.id)}
                    onCheckedChange={() => toggleOne(url.id)}
                    aria-label={`Select ${url.shortCode}`}
                  />
                </td>
                <td className='px-4 py-3'>
                  <div className='flex items-center gap-2 max-w-xs'>
                    <span className='text-sm text-muted-foreground truncate' title={url.originalUrl}>
                      {url.originalUrl}
                    </span>
                    <a href={url.originalUrl} target='_blank' rel='noopener noreferrer'
                      className='shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100'>
                      <ExternalLink className='size-3.5' />
                    </a>
                  </div>
                </td>
                <td className='px-4 py-3'>
                  <span className='font-mono text-sm font-medium text-violet-600 dark:text-violet-400'>
                    /r/{url.shortCode}
                  </span>
                </td>
                <td className='px-4 py-3'><StatusBadge url={url} /></td>
                <td className='px-4 py-3'><ExpiryBadge expiresAt={url.expiresAt} /></td>
                <td className='px-4 py-3'>
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground'>
                    {url.clicks}
                  </span>
                </td>
                <td className='px-4 py-3 text-sm text-muted-foreground'>
                  {formatDistanceToNow(new Date(url.createdAt), { addSuffix: true })}
                </td>
                <td className='px-4 py-3'>
                  <div className='flex items-center justify-end gap-1'>
                    <Button variant='ghost' size='icon'
                      className={cn('size-7 transition-colors', copiedId === url.id ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-muted-foreground hover:text-foreground')}
                      onClick={() => copyToClipboard(url.id, url.shortCode)}>
                      {copiedId === url.id ? <Check className='size-3.5' /> : <Copy className='size-3.5' />}
                    </Button>
                    <Button variant='ghost' size='icon' className='size-7 text-muted-foreground hover:text-foreground'
                      onClick={() => showQrCode(url.shortCode)}>
                      <QrCode className='size-3.5' />
                    </Button>
                    <Button variant='ghost' size='icon' className='size-7 text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400'
                      onClick={() => handleEdit(url.id, url.shortCode)}>
                      <Edit className='size-3.5' />
                    </Button>
                    {/* Password toggle */}
                    <Button
                      variant='ghost' size='icon'
                      className={cn('size-7', url.passwordProtected
                        ? 'text-violet-600 dark:text-violet-400 hover:text-red-500'
                        : 'text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400')}
                      onClick={() => setPasswordToggleUrl(url)}
                      title={url.passwordProtected ? 'Remove password protection' : 'Add password protection'}
                    >
                      {url.passwordProtected ? <Lock className='size-3.5' /> : <LockOpen className='size-3.5' />}
                    </Button>
                    <Button variant='ghost' size='icon' className='size-7 text-muted-foreground hover:text-destructive'
                      onClick={() => handleDelete(url.id)} disabled={isDeleting === url.id}>
                      {isDeleting === url.id
                        ? <span className='size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent' />
                        : <Trash2Icon className='size-3.5' />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className='md:hidden divide-y divide-border/40'>
        {filteredAndSorted.length === 0 ? (
          <div className='p-6 text-center text-sm text-muted-foreground'>No links match &ldquo;{search}&rdquo;</div>
        ) : filteredAndSorted.map((url) => (
          <div key={url.id} className={cn('p-4 space-y-3', selectedIds.has(url.id) && 'bg-violet-50/50 dark:bg-violet-900/10')}>
            <div className='flex items-start gap-3'>
              <Checkbox
                checked={selectedIds.has(url.id)}
                onCheckedChange={() => toggleOne(url.id)}
                className='mt-0.5'
              />
              <div className='flex-1 min-w-0'>
                <p className='font-mono text-sm font-semibold text-violet-600 dark:text-violet-400 truncate'>
                  /r/{url.shortCode}
                </p>
                <p className='text-xs text-muted-foreground truncate mt-0.5'>{url.originalUrl}</p>
                <div className='flex flex-wrap items-center gap-1.5 mt-1.5'>
                  <StatusBadge url={url} />
                  {url.expiresAt && <ExpiryBadge expiresAt={url.expiresAt} />}
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground'>
                    {url.clicks} clicks
                  </span>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' className='flex-1 h-8 text-xs' onClick={() => copyToClipboard(url.id, url.shortCode)}>
                {copiedId === url.id ? <><Check className='size-3 mr-1' />Copied!</> : <><Copy className='size-3 mr-1' />Copy</>}
              </Button>
              <Button variant='outline' size='icon' className='size-8' onClick={() => showQrCode(url.shortCode)}>
                <QrCode className='size-3.5' />
              </Button>
              <Button variant='outline' size='icon' className='size-8' onClick={() => handleEdit(url.id, url.shortCode)}>
                <Edit className='size-3.5' />
              </Button>
              <Button variant='outline' size='icon'
                className={cn('size-8', url.passwordProtected && 'text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800')}
                onClick={() => setPasswordToggleUrl(url)}>
                {url.passwordProtected ? <Lock className='size-3.5' /> : <LockOpen className='size-3.5' />}
              </Button>
              <Button variant='outline' size='icon' className='size-8 text-destructive border-destructive/20 hover:bg-destructive/10'
                onClick={() => handleDelete(url.id)} disabled={isDeleting === url.id}>
                <Trash2Icon className='size-3.5' />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className='flex items-center justify-between px-4 py-3 border-t border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 animate-fade-up'>
          <span className='text-sm font-medium text-violet-700 dark:text-violet-300'>
            {selectedIds.size} link{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' className='gap-1.5 text-xs h-7' onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
            <Button
              size='sm'
              className='gap-1.5 text-xs h-7 bg-red-600 hover:bg-red-700 text-white border-0'
              disabled={isBulkDeleting}
              onClick={handleBulkDelete}
            >
              {isBulkDeleting ? <Loader2 className='size-3 animate-spin' /> : <Trash2Icon className='size-3' />}
              Delete {selectedIds.size}
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <QRCodeModal isOpen={isQrCodeModalOpen} onOpenChange={setIsQrCodeModalOpen} url={qrCodeUrl} shortCode={qrCodeShortCode} />
      {urlToEdit && (
        <EditUrlModal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen}
          urlId={urlToEdit.id} currentShortCode={urlToEdit.shortCode} onSuccess={handleEditSuccess} />
      )}
      {passwordToggleUrl && (
        <PasswordToggleModal
          url={passwordToggleUrl}
          onClose={() => setPasswordToggleUrl(null)}
          onSuccess={handlePasswordToggleSuccess}
        />
      )}
    </>
  );
}
