import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUrlByShortCode } from '@/server/actions/urls/get-url';
import { AlertTriangle, Clock, ExternalLink, Link2, Lock } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { PasswordForm } from '@/components/modals/password-form';
import { format } from 'date-fns';

export const metadata: Metadata = {
  title: 'Redirecting… | Shortify',
  description: 'You are being redirected to the original URL',
};

type Params = Promise<{ shortCode: string }>;

export default async function RedirectPage(props: { params: Params }) {
  const { shortCode } = await props.params;
  const response = await getUrlByShortCode(shortCode);

  if (response.success && response.data) {
    const data = response.data;

    // ── Expired URL ───────────────────────────────────────────────────
    if (data.expired) {
      return (
        <div className='flex h-[calc(100vh-64px)] items-center justify-center px-4'>
          <div className='w-full max-w-md mx-auto text-center'>
            <div className='flex justify-center mb-6'>
              <div className='size-16 rounded-2xl bg-muted flex items-center justify-center'>
                <Clock className='size-8 text-muted-foreground' />
              </div>
            </div>
            <h1 className='text-2xl font-bold mb-2'>Link Expired</h1>
            <p className='text-muted-foreground mb-4 text-sm leading-relaxed'>
              This shortened link has expired and is no longer available.
            </p>
            {data.expiresAt && (
              <div className='bg-muted/50 border border-border/60 rounded-xl p-3 mb-6 text-sm text-muted-foreground'>
                Expired on{' '}
                <span className='font-medium text-foreground'>
                  {format(new Date(data.expiresAt), 'PPP')}
                </span>
              </div>
            )}
            <Button
              asChild
              className='bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'
            >
              <Link href='/'>Return to Homepage</Link>
            </Button>
          </div>
        </div>
      );
    }

    // ── Password-protected URL ────────────────────────────────────────
    if (data.passwordProtected) {
      // Check if user already has valid access cookie
      const cookieStore = await cookies();
      const accessCookie = cookieStore.get(`shortlink_access_${shortCode}`);

      if (!accessCookie) {
        return (
          <div className='flex h-[calc(100vh-64px)] items-center justify-center px-4'>
            <div className='w-full max-w-md mx-auto text-center'>
              <div className='flex justify-center mb-6'>
                <div className='size-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center'>
                  <Lock className='size-8 text-violet-600 dark:text-violet-400' />
                </div>
              </div>
              <h1 className='text-2xl font-bold mb-2'>
                Password Protected Link
              </h1>
              <p className='text-muted-foreground mb-6 text-sm leading-relaxed'>
                This link is protected. Enter the password to continue.
              </p>
              <PasswordForm shortCode={shortCode} />
            </div>
          </div>
        );
      }
      // Has valid cookie — fall through to redirect below
      redirect(data.originalUrl);
    }

    // ── Flagged URL ───────────────────────────────────────────────────
    if (data.flagged) {
      return (
        <div className='flex h-[calc(100vh-64px)] items-center justify-center px-4'>
          <div className='w-full max-w-md mx-auto text-center'>
            <div className='flex justify-center mb-6'>
              <div className='size-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center'>
                <AlertTriangle className='size-8 text-amber-600 dark:text-amber-400' />
              </div>
            </div>
            <h1 className='text-2xl font-bold mb-2 text-amber-700 dark:text-amber-300'>
              Caution: Flagged URL
            </h1>
            <p className='text-muted-foreground mb-4 text-sm leading-relaxed'>
              This link has been flagged by our AI safety system and is pending
              review by an administrator.
            </p>
            {data.flagReason && (
              <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-6 text-sm text-amber-700 dark:text-amber-400'>
                <span className='font-medium'>Reason:</span> {data.flagReason}
              </div>
            )}
            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <Button
                asChild
                variant='outline'
                className='border-border/60 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400'
              >
                <Link href='/'>Return to Homepage</Link>
              </Button>
              <Button
                asChild
                className='bg-amber-500 hover:bg-amber-600 text-white border-0 gap-2'
              >
                <a
                  href={data.originalUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Proceed Anyway <ExternalLink className='size-4' />
                </a>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // ── Normal redirect ───────────────────────────────────────────────
    redirect(data.originalUrl);
  }

  // ── URL not found ─────────────────────────────────────────────────────
  return (
    <div className='flex h-[calc(100vh-64px)] items-center justify-center px-4'>
      <div className='w-full max-w-md mx-auto text-center'>
        <div className='flex justify-center mb-6'>
          <div className='size-16 rounded-2xl bg-destructive/10 flex items-center justify-center'>
            <Link2 className='size-8 text-destructive' />
          </div>
        </div>
        <h1 className='text-2xl font-bold text-destructive mb-2'>
          URL Not Found
        </h1>
        <p className='text-muted-foreground mb-6 text-sm leading-relaxed'>
          The short link you&apos;re trying to access doesn&apos;t exist or has
          been removed.
        </p>
        <Button
          asChild
          className='bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'
        >
          <Link href='/'>Return to Homepage</Link>
        </Button>
      </div>
    </div>
  );
}
