'use client';

import { useState } from 'react';
import { forgotPassword } from '@/server/actions/auth/forgot-password';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Link2, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(parsed.data);
      // Always show success — we don't leak whether email exists
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center px-4 bg-background'>
      <div className='w-full max-w-[400px]'>
        <Link href='/' className='inline-flex items-center gap-2 mb-10'>
          <div className='size-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
            <Link2 className='size-4' />
          </div>
          <span className='font-bold text-lg'>Shortify</span>
        </Link>

        {submitted ? (
          <div className='text-center'>
            <div className='inline-flex p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-6'>
              <CheckCircle2 className='size-10 text-emerald-500' />
            </div>
            <h1 className='text-2xl font-bold mb-3'>Check your inbox</h1>
            <p className='text-muted-foreground mb-8 leading-relaxed'>
              If an account exists for <span className='font-medium text-foreground'>{email}</span>,
              we've sent a password reset link. It expires in 1 hour.
            </p>
            <Link
              href='/login'
              className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
            >
              <ArrowLeft className='size-4' /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className='mb-8'>
              <h1 className='text-[28px] font-bold tracking-tight mb-1.5'>Forgot password?</h1>
              <p className='text-muted-foreground text-sm'>
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-1.5'>
                <label className='text-sm font-medium'>Email</label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                  <Input
                    type='email'
                    placeholder='you@example.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className='h-11 pl-9 rounded-xl'
                    autoComplete='email'
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className='p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm'>
                  {error}
                </div>
              )}

              <Button
                type='submit'
                disabled={isLoading || !email.trim()}
                className='w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'
              >
                {isLoading
                  ? <><Loader2 className='size-4 animate-spin mr-2' />Sending…</>
                  : 'Send reset link'}
              </Button>
            </form>

            <p className='text-center text-sm text-muted-foreground mt-8'>
              <Link
                href='/login'
                className='inline-flex items-center gap-1.5 hover:text-foreground transition-colors'
              >
                <ArrowLeft className='size-3.5' /> Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
