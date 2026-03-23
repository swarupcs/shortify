'use client';

import { useState } from 'react';
import { sendVerification } from '@/server/actions/auth/send-verification';
import { AlertTriangle, Mail, Loader2, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export function VerificationBanner() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      const result = await sendVerification();
      if (result.success) {
        setSent(true);
        toast.success('Verification email sent!', { description: 'Check your inbox.' });
      } else {
        toast.error('Could not send', { description: result.error });
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className='flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'>
      <AlertTriangle className='size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-amber-800 dark:text-amber-300'>
          Verify your email to start shortening
        </p>
        <p className='text-xs text-amber-700 dark:text-amber-400 mt-0.5'>
          We sent a verification link to your email when you signed up.
        </p>
        {!sent ? (
          <button
            onClick={handleResend}
            disabled={sending}
            className='mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline underline-offset-4 disabled:opacity-50'
          >
            {sending
              ? <><Loader2 className='size-3 animate-spin' />Sending…</>
              : <><Mail className='size-3' />Resend verification email</>}
          </button>
        ) : (
          <p className='mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
            <CheckCircle2 className='size-3' /> Email sent — check your inbox
          </p>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className='text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 shrink-0'
        aria-label='Dismiss'
      >
        <X className='size-4' />
      </button>
    </div>
  );
}
