'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiKeyRow,
} from '@/server/actions/api-keys/api-key-actions';
import { cn } from '@/lib/utils';

export function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState<number | null>(null);

  useEffect(() => {
    listApiKeys().then((res) => {
      if (res.success && res.data) setKeys(res.data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await createApiKey(newKeyName.trim());
      if (res.success && res.data) {
        setKeys((prev) => [res.data!.row, ...prev]);
        setNewlyCreatedKey(res.data.key);
        setNewKeyName('');
        setShowCreate(false);
        toast.success('API key created');
      } else {
        toast.error('Failed to create key', { description: res.error });
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: number) => {
    setRevokingId(id);
    try {
      const res = await revokeApiKey(id);
      if (res.success) {
        setKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, revokedAt: new Date() } : k)),
        );
        toast.success('API key revoked');
      } else {
        toast.error('Failed to revoke', { description: res.error });
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setRevokingId(null);
      setShowRevokeConfirm(null);
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(true);
    toast.success('Key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const activeKeys = keys.filter((k) => !k.revokedAt);
  const revokedKeys = keys.filter((k) => k.revokedAt);

  return (
    <div className='space-y-6'>

      {/* ── Header ── */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold'>API Keys</h2>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Use API keys to shorten URLs programmatically via{' '}
            <code className='text-xs bg-muted px-1 py-0.5 rounded'>POST /api/v1/shorten</code>
          </p>
        </div>
        {!showCreate && (
          <Button
            onClick={() => setShowCreate(true)}
            disabled={activeKeys.length >= 10}
            className='gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'
          >
            <Plus className='size-4' />
            New Key
          </Button>
        )}
      </div>

      {/* ── New key created — show once ── */}
      {newlyCreatedKey && (
        <div className='p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'>
          <div className='flex items-start gap-3 mb-3'>
            <div className='size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0'>
              <Key className='size-4 text-emerald-600 dark:text-emerald-400' />
            </div>
            <div>
              <p className='text-sm font-semibold text-emerald-800 dark:text-emerald-300'>
                Your new API key
              </p>
              <p className='text-xs text-emerald-700 dark:text-emerald-400 mt-0.5'>
                Copy it now — it will never be shown again.
              </p>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className='ml-auto text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200'
            >
              <X className='size-4' />
            </button>
          </div>
          <div className='flex items-center gap-2'>
            <code className='flex-1 px-3 py-2 rounded-xl bg-background border border-emerald-200 dark:border-emerald-700 text-sm font-mono text-emerald-700 dark:text-emerald-300 truncate'>
              {newlyCreatedKey}
            </code>
            <Button
              variant='outline'
              size='icon'
              className={cn(
                'size-9 shrink-0 border-emerald-200 dark:border-emerald-700',
                copiedKey && 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600',
              )}
              onClick={() => copyKey(newlyCreatedKey)}
            >
              {copiedKey ? <Check className='size-4' /> : <Copy className='size-4' />}
            </Button>
          </div>
        </div>
      )}

      {/* ── Create form ── */}
      {showCreate && (
        <div className='p-4 rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10 space-y-3'>
          <p className='text-sm font-medium'>Name your new key</p>
          <p className='text-xs text-muted-foreground'>
            Give it a descriptive name so you remember what it&apos;s used for (e.g. &ldquo;My CLI tool&rdquo;, &ldquo;Zapier integration&rdquo;).
          </p>
          <div className='flex gap-2'>
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder='e.g. My automation script'
              maxLength={100}
              className='h-9 text-sm'
              autoFocus
            />
            <Button
              onClick={handleCreate}
              disabled={creating || !newKeyName.trim()}
              className='shrink-0 gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'
            >
              {creating ? <Loader2 className='size-4 animate-spin' /> : <Plus className='size-4' />}
              Create
            </Button>
            <Button
              variant='outline'
              size='icon'
              className='shrink-0'
              onClick={() => { setShowCreate(false); setNewKeyName(''); }}
            >
              <X className='size-4' />
            </Button>
          </div>
        </div>
      )}

      {/* ── Active keys ── */}
      {loading ? (
        <div className='flex justify-center py-10'>
          <Loader2 className='size-6 animate-spin text-violet-600 dark:text-violet-400' />
        </div>
      ) : (
        <Card className='border-border/60 rounded-2xl overflow-hidden'>
          <CardHeader className='pb-3 border-b border-border/60 bg-muted/20'>
            <CardTitle className='text-sm'>
              Active keys
              <span className='ml-2 text-xs font-normal text-muted-foreground'>
                {activeKeys.length} / 10
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {activeKeys.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-center px-4'>
                <div className='size-12 rounded-2xl bg-muted flex items-center justify-center mb-3'>
                  <Key className='size-5 text-muted-foreground' />
                </div>
                <p className='font-medium text-sm mb-1'>No API keys yet</p>
                <p className='text-xs text-muted-foreground max-w-xs'>
                  Create a key to start using the Shortify API programmatically.
                </p>
              </div>
            ) : (
              <div className='divide-y divide-border/40'>
                {activeKeys.map((key) => (
                  <div key={key.id} className='flex items-center gap-4 px-4 py-3.5'>
                    <div className='size-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0'>
                      <Key className='size-3.5 text-violet-600 dark:text-violet-400' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>{key.name}</p>
                      <div className='flex items-center gap-2 mt-0.5'>
                        <code className='text-xs text-muted-foreground font-mono'>
                          {key.keyPrefix}••••••••••••••••••••••••
                        </code>
                      </div>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        Created {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                        {key.lastUsedAt && (
                          <> · Last used {formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}</>
                        )}
                        {!key.lastUsedAt && <> · Never used</>}
                      </p>
                    </div>

                    {/* Revoke */}
                    {showRevokeConfirm === key.id ? (
                      <div className='flex items-center gap-2 shrink-0'>
                        <span className='text-xs text-destructive font-medium'>Revoke?</span>
                        <Button
                          variant='destructive'
                          size='sm'
                          className='h-7 text-xs px-2'
                          onClick={() => handleRevoke(key.id)}
                          disabled={revokingId === key.id}
                        >
                          {revokingId === key.id ? <Loader2 className='size-3 animate-spin' /> : 'Yes'}
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-7 text-xs px-2'
                          onClick={() => setShowRevokeConfirm(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-8 text-muted-foreground hover:text-destructive shrink-0'
                        onClick={() => setShowRevokeConfirm(key.id)}
                      >
                        <Trash2 className='size-4' />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Revoked keys (collapsed) ── */}
      {revokedKeys.length > 0 && (
        <details className='group'>
          <summary className='text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1'>
            <span className='group-open:hidden'>▶</span>
            <span className='hidden group-open:inline'>▼</span>
            {revokedKeys.length} revoked key{revokedKeys.length !== 1 ? 's' : ''}
          </summary>
          <div className='mt-3 rounded-2xl border border-border/60 overflow-hidden'>
            <div className='divide-y divide-border/40'>
              {revokedKeys.map((key) => (
                <div key={key.id} className='flex items-center gap-4 px-4 py-3 opacity-50'>
                  <div className='size-8 rounded-lg bg-muted flex items-center justify-center shrink-0'>
                    <Key className='size-3.5 text-muted-foreground' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate line-through text-muted-foreground'>
                      {key.name}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Revoked {formatDistanceToNow(new Date(key.revokedAt!), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {/* ── Usage docs ── */}
      <Card className='border-border/60 rounded-2xl'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm'>API usage</CardTitle>
          <CardDescription className='text-xs'>
            How to use your API key to shorten URLs
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <p className='text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide'>
              Endpoint
            </p>
            <code className='block text-xs bg-muted rounded-xl px-3 py-2 font-mono'>
              POST /api/v1/shorten
            </code>
          </div>
          <div>
            <p className='text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide'>
              Example request
            </p>
            <pre className='text-xs bg-muted rounded-xl px-3 py-3 font-mono overflow-x-auto leading-relaxed'>{`curl -X POST \\
  ${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/v1/shorten \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/very-long-url"}'`}</pre>
          </div>
          <div>
            <p className='text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide'>
              Response
            </p>
            <pre className='text-xs bg-muted rounded-xl px-3 py-3 font-mono overflow-x-auto leading-relaxed'>{`{
  "shortUrl": "https://yourdomain.com/r/abc123",
  "shortCode": "abc123",
  "flagged": false
}`}</pre>
          </div>
          <div>
            <p className='text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide'>
              Optional body fields
            </p>
            <div className='space-y-1.5'>
              {[
                { field: 'customCode', type: 'string', desc: 'Custom short code (e.g. "my-link")' },
                { field: 'expiresAt', type: 'string', desc: 'ISO date for expiry (e.g. "2025-12-31")' },
              ].map(({ field, type, desc }) => (
                <div key={field} className='flex items-start gap-2 text-xs'>
                  <code className='bg-muted px-1.5 py-0.5 rounded font-mono shrink-0'>{field}</code>
                  <span className='text-muted-foreground'>{type} — {desc}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
