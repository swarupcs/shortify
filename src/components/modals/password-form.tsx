'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verifyUrlPassword } from '@/server/actions/urls/verify-url-password';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PasswordFormProps {
  shortCode: string;
}

export function PasswordForm({ shortCode }: PasswordFormProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyUrlPassword(shortCode, password);
      if (result.success && result.data) {
        // Cookie has been set server-side — now redirect
        router.push(result.data.originalUrl);
      } else {
        setError(result.error || 'Incorrect password');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4 max-w-sm mx-auto'>
      <div className='relative'>
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder='Enter password…'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className='h-11 pr-10 text-center rounded-xl border-border/60 focus-visible:ring-violet-500/20 focus-visible:border-violet-400'
          autoFocus
        />
        <button
          type='button'
          onClick={() => setShowPassword(!showPassword)}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className='size-4' />
          ) : (
            <Eye className='size-4' />
          )}
        </button>
      </div>

      {error && (
        <div className='text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2'>
          {error}
        </div>
      )}

      <Button
        type='submit'
        disabled={isLoading || !password.trim()}
        className='w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'
      >
        {isLoading ? (
          <Loader2 className='size-4 animate-spin mr-2' />
        ) : null}
        {isLoading ? 'Verifying…' : 'Continue'}
      </Button>
    </form>
  );
}
