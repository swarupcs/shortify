import { verifyEmail } from '@/server/actions/auth/verify-email';
import { CheckCircle2, XCircle, Clock, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Verify Email | Shortify' };

type Props = { searchParams: Promise<{ token?: string }> };

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const result = token ? await verifyEmail(token) : { status: 'invalid' as const };

  const config = {
    success: {
      icon: <CheckCircle2 className='size-10 text-emerald-500' />,
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      title: 'Email verified!',
      message: 'Your email has been verified. You can now shorten URLs.',
      cta: { label: 'Go to Dashboard', href: '/dashboard' },
    },
    expired: {
      icon: <Clock className='size-10 text-amber-500' />,
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      title: 'Link expired',
      message: 'This verification link has expired. Sign in and request a new one.',
      cta: { label: 'Sign in', href: '/login' },
    },
    already_verified: {
      icon: <CheckCircle2 className='size-10 text-emerald-500' />,
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      title: 'Already verified',
      message: 'Your email is already verified. You\'re all set!',
      cta: { label: 'Go to Dashboard', href: '/dashboard' },
    },
    invalid: {
      icon: <XCircle className='size-10 text-destructive' />,
      bg: 'bg-destructive/10',
      title: 'Invalid link',
      message: 'This verification link is invalid or has already been used.',
      cta: { label: 'Go home', href: '/' },
    },
  }[result.status];

  return (
    <div className='min-h-screen flex items-center justify-center px-4 bg-background'>
      <div className='w-full max-w-md text-center'>
        <Link href='/' className='inline-flex items-center gap-2 mb-10'>
          <div className='size-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
            <Link2 className='size-4' />
          </div>
          <span className='font-bold text-lg'>Shortify</span>
        </Link>

        <div className={`inline-flex p-4 rounded-2xl mb-6 ${config.bg}`}>
          {config.icon}
        </div>

        <h1 className='text-2xl font-bold mb-3'>{config.title}</h1>
        <p className='text-muted-foreground mb-8 leading-relaxed'>{config.message}</p>

        <Button
          asChild
          className='bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'
        >
          <Link href={config.cta.href}>{config.cta.label}</Link>
        </Button>
      </div>
    </div>
  );
}
