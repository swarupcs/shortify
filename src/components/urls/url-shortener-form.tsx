'use client';

import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { shortenUrl } from '@/server/actions/urls/shorten-url';
import { Card, CardContent } from '../ui/card';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Link2,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { QRCodeModal } from '../modals/qr-code-modal';
import { toast } from 'sonner';
import { SignupSuggestionDialog } from '../dialogs/signup-suggestion-dialog';
import { BASEURL } from '@/lib/const';
import { cn } from '@/lib/utils';

const ADVANCED_STORAGE_KEY = 'shortify_show_advanced';

const urlFormSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .transform((val) => {
      if (!/^https?:\/\//i.test(val)) return `https://${val}`;
      return val;
    })
    .refine((val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, 'Please enter a valid URL'),
  customCode: z
    .string()
    .max(20, 'Must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens, underscores')
    .optional(),
  expiresAt: z.string().optional(),
  password: z.string().max(100, 'Password too long').optional(),
});

type UrlFormData = z.infer<typeof urlFormSchema>;

interface UrlShortenerFormProps {
  onSuccess?: () => void;
}

export function UrlShortenerForm({ onSuccess }: UrlShortenerFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [flaggedInfo, setFlaggedInfo] = useState<{
    flagged: boolean;
    reason: string | null;
    message: string | undefined;
  } | null>(null);

  // ── Persist showAdvanced in localStorage ──────────────────────────────
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADVANCED_STORAGE_KEY);
      if (stored !== null) setShowAdvanced(stored === 'true');
    } catch {
      // localStorage may be unavailable (SSR, private browsing) — safe to ignore
    }
  }, []);

  const toggleAdvanced = () => {
    setShowAdvanced((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(ADVANCED_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };
  // ─────────────────────────────────────────────────────────────────────

  const form = useForm<UrlFormData>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: { url: '', customCode: undefined, expiresAt: '', password: '' },
  });

  const onSubmit = async (data: UrlFormData) => {
    setIsLoading(true);
    setError(null);
    setShortUrl(null);
    setShortCode(null);
    setFlaggedInfo(null);

    try {
      const formData = new FormData();
      formData.append('url', data.url);
      if (data.customCode) formData.append('customCode', data.customCode);
      if (data.expiresAt) formData.append('expiresAt', data.expiresAt);
      if (data.password) formData.append('password', data.password);

      const response = await shortenUrl(formData);

      if (response.success && response.data) {
        setShortUrl(response.data.shortUrl);
        const match = response.data.shortUrl.match(/\/r\/([^/]+)$/);
        if (match?.[1]) setShortCode(match[1]);

        if (response.data.flagged) {
          setFlaggedInfo({
            flagged: response.data.flagged,
            reason: response.data.flagReason || null,
            message: response.data.message,
          });
          toast.warning('URL flagged for review', {
            description: response.data.flagReason,
          });
        } else {
          toast.success('Link shortened successfully!');
        }

        form.reset();
        onSuccess?.();
      } else {
        setError(response.error || 'Something went wrong');
      }

      if (session?.user && pathname.includes('/dashboard')) router.refresh();
      if (!session?.user) setShowSignupDialog(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <>
      <div className='w-full max-w-2xl mx-auto'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3'>
            {/* ── Main URL input ── */}
            <div className='flex gap-2 p-1.5 rounded-2xl border border-border bg-background shadow-sm focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-400 transition-all'>
              <div className='flex items-center pl-2 text-muted-foreground'>
                <Link2 className='size-4 shrink-0' />
              </div>
              <FormField
                control={form.control}
                name='url'
                render={({ field }) => (
                  <FormItem className='flex-1'>
                    <FormControl>
                      <input
                        {...field}
                        placeholder='Paste your long URL here...'
                        className='w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60 py-2'
                        autoComplete='off'
                      />
                    </FormControl>
                    <FormMessage className='text-xs ml-0 mt-1' />
                  </FormItem>
                )}
              />
              <Button
                type='submit'
                disabled={isLoading}
                className='rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-none shrink-0'
              >
                {isLoading ? (
                  <span className='flex items-center gap-2'>
                    <span className='size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                    Shortening
                  </span>
                ) : (
                  <span className='flex items-center gap-2'>
                    <Sparkles className='size-3.5' />
                    Shorten
                  </span>
                )}
              </Button>
            </div>

            {/* ── Advanced toggle ── */}
            <button
              type='button'
              onClick={toggleAdvanced}
              className='flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto'
            >
              {showAdvanced ? (
                <ChevronUp className='size-3' />
              ) : (
                <ChevronDown className='size-3' />
              )}
              {showAdvanced ? 'Hide' : 'Show'} advanced options
            </button>

            {/* ── Advanced options ── */}
            {showAdvanced && (
              <div className='p-4 rounded-xl border border-border/60 bg-muted/30 space-y-4'>
                {/* Custom code */}
                <FormField
                  control={form.control}
                  name='customCode'
                  render={({ field }) => (
                    <FormItem>
                      <p className='text-xs font-medium text-muted-foreground mb-1.5'>
                        Custom short code
                      </p>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-muted-foreground whitespace-nowrap shrink-0'>
                          {BASEURL}/r/
                        </span>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(e.target.value || undefined)
                            }
                            placeholder='custom-code (optional)'
                            disabled={isLoading}
                            className='h-8 text-sm'
                          />
                        </FormControl>
                      </div>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />

                <div className='grid sm:grid-cols-2 gap-4'>
                  {/* Expiry date */}
                  <FormField
                    control={form.control}
                    name='expiresAt'
                    render={({ field }) => (
                      <FormItem>
                        <p className='text-xs font-medium text-muted-foreground mb-1.5'>
                          Expiry date (optional)
                        </p>
                        <FormControl>
                          <Input
                            {...field}
                            type='date'
                            min={minDateStr}
                            disabled={isLoading}
                            className='h-8 text-sm'
                          />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem>
                        <p className='text-xs font-medium text-muted-foreground mb-1.5'>
                          Password protection (optional)
                        </p>
                        <FormControl>
                          <div className='relative'>
                            <Input
                              {...field}
                              type={showPassword ? 'text' : 'password'}
                              placeholder='Set a password…'
                              disabled={isLoading}
                              className='h-8 text-sm pr-8'
                            />
                            <button
                              type='button'
                              onClick={() => setShowPassword(!showPassword)}
                              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                              tabIndex={-1}
                            >
                              {showPassword ? (
                                <EyeOff className='size-3.5' />
                              ) : (
                                <Eye className='size-3.5' />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div className='flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-xl text-sm'>
                <AlertTriangle className='size-4 shrink-0' />
                {error}
              </div>
            )}

            {/* ── Result card ── */}
            {shortUrl && (
              <Card className='border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 overflow-hidden'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <p className='text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide'>
                      Your short link
                    </p>
                    <a
                      href={shortUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors'
                    >
                      Preview <ExternalLink className='size-3' />
                    </a>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex-1 px-3 py-2 rounded-lg bg-background border border-violet-200 dark:border-violet-700 font-mono text-sm text-violet-700 dark:text-violet-300 truncate'>
                      {shortUrl}
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      className={cn(
                        'size-9 border-violet-200 dark:border-violet-700 shrink-0 transition-all',
                        copied &&
                          'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400',
                      )}
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <Check className='size-4' />
                      ) : (
                        <Copy className='size-4' />
                      )}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      className='size-9 border-violet-200 dark:border-violet-700 shrink-0'
                      onClick={() => setIsQrCodeModalOpen(true)}
                    >
                      <QrCode className='size-4' />
                    </Button>
                  </div>

                  {flaggedInfo?.flagged && (
                    <div className='mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-2'>
                      <AlertTriangle className='size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
                      <div>
                        <p className='text-sm font-medium text-amber-800 dark:text-amber-300'>
                          Link flagged for review
                        </p>
                        <p className='text-xs text-amber-600 dark:text-amber-400 mt-0.5'>
                          {flaggedInfo.message || 'This URL is pending admin review.'}
                        </p>
                        {flaggedInfo.reason && (
                          <p className='text-xs text-amber-600 dark:text-amber-400 mt-1'>
                            Reason: {flaggedInfo.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </form>
        </Form>
      </div>

      <SignupSuggestionDialog
        isOpen={showSignupDialog}
        onOpenChange={setShowSignupDialog}
        shortUrl={shortUrl || ''}
      />
      {shortUrl && shortCode && (
        <QRCodeModal
          isOpen={isQrCodeModalOpen}
          onOpenChange={setIsQrCodeModalOpen}
          url={shortUrl}
          shortCode={shortCode}
        />
      )}
    </>
  );
}
