'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/server/actions/auth/reset-password';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Link2, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';

function getStrength(password: string) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) { setError('Invalid reset link.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      const result = await resetPassword(token, password);
      if (result.status === 'success') {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2500);
      } else if (result.status === 'expired') {
        setError('This reset link has expired. Please request a new one.');
      } else if (result.status === 'validation_error') {
        setError(result.message);
      } else {
        setError('Invalid or already-used reset link. Please request a new one.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className='text-center'>
        <div className='inline-flex p-4 rounded-2xl bg-destructive/10 mb-6'>
          <XCircle className='size-10 text-destructive' />
        </div>
        <h1 className='text-2xl font-bold mb-3'>Invalid link</h1>
        <p className='text-muted-foreground mb-8'>This password reset link is invalid or missing.</p>
        <Link href='/forgot-password' className='text-violet-600 dark:text-violet-400 hover:underline underline-offset-4 text-sm'>
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className='text-center'>
        <div className='inline-flex p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-6'>
          <CheckCircle2 className='size-10 text-emerald-500' />
        </div>
        <h1 className='text-2xl font-bold mb-3'>Password updated!</h1>
        <p className='text-muted-foreground'>Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <>
      <div className='mb-8'>
        <h1 className='text-[28px] font-bold tracking-tight mb-1.5'>Choose a new password</h1>
        <p className='text-muted-foreground text-sm'>Must be at least 6 characters.</p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* New password */}
        <div className='space-y-1.5'>
          <label className='text-sm font-medium'>New password</label>
          <div className='relative'>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder='Min. 6 characters'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className='h-11 rounded-xl pr-10'
              autoComplete='new-password'
              autoFocus
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
            </button>
          </div>
          {password && (
            <div className='space-y-1.5 pt-1'>
              <div className='flex gap-1'>
                {[1, 2, 3, 4].map((l) => (
                  <div
                    key={l}
                    className={cn('h-1 flex-1 rounded-full transition-all duration-300',
                      strength.score >= l ? strength.color : 'bg-border')}
                  />
                ))}
              </div>
              {strength.label && (
                <p className='text-xs text-muted-foreground'>
                  Strength:{' '}
                  <span className={cn('font-medium',
                    strength.label === 'Weak'   && 'text-red-500',
                    strength.label === 'Fair'   && 'text-amber-500',
                    strength.label === 'Good'   && 'text-blue-500',
                    strength.label === 'Strong' && 'text-emerald-500',
                  )}>
                    {strength.label}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className='space-y-1.5'>
          <label className='text-sm font-medium'>Confirm password</label>
          <div className='relative'>
            <Input
              type={showConfirm ? 'text' : 'password'}
              placeholder='Re-enter your password'
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={isLoading}
              className='h-11 rounded-xl pr-10'
              autoComplete='new-password'
            />
            <button
              type='button'
              onClick={() => setShowConfirm(!showConfirm)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
            </button>
          </div>
        </div>

        {error && (
          <div className='p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm'>
            {error}
          </div>
        )}

        <Button
          type='submit'
          disabled={isLoading || !password || !confirm}
          className='w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'
        >
          {isLoading
            ? <><Loader2 className='size-4 animate-spin mr-2' />Updating…</>
            : 'Update password'}
        </Button>
      </form>

      <p className='text-center text-sm text-muted-foreground mt-8'>
        Remember it?{' '}
        <Link href='/login' className='font-medium text-violet-600 dark:text-violet-400 hover:underline underline-offset-4'>
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className='min-h-screen flex items-center justify-center px-4 bg-background'>
      <div className='w-full max-w-[400px]'>
        <Link href='/' className='inline-flex items-center gap-2 mb-10'>
          <div className='size-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
            <Link2 className='size-4' />
          </div>
          <span className='font-bold text-lg'>Shortify</span>
        </Link>
        <Suspense fallback={<div className='h-64 flex items-center justify-center'><Loader2 className='size-6 animate-spin text-muted-foreground' /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
