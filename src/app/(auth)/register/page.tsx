import { Link2, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';

const perks = [
  'Save and manage all your short links',
  'Track clicks with detailed analytics',
  'Create custom branded short codes',
  'AI safety scanning on every link',
];

export default function RegisterPage() {
  return (
    <div className='min-h-screen flex bg-background'>
      <div className='hidden lg:flex flex-col w-[520px] shrink-0 relative overflow-hidden bg-[#0f0a1e]'>
        <div className='absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-fuchsia-700/35 blur-[100px] pointer-events-none' />
        <div className='absolute bottom-[-60px] left-[-80px] w-[300px] h-[300px] rounded-full bg-violet-700/30 blur-[80px] pointer-events-none' />
        <div
          className='absolute inset-0 opacity-[0.07] pointer-events-none'
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className='relative z-10 flex flex-col h-full p-12'>
          <Link href='/' className='flex items-center gap-3 w-fit group'>
            <div className='size-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/15 transition-colors'>
              <Link2 className='size-4 text-white' />
            </div>
            <span className='text-white font-bold text-lg'>Shortify</span>
          </Link>
          <div className='mt-auto'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-400/20 text-fuchsia-300 text-xs mb-6'>
              <Sparkles className='size-3' />
              Free forever plan available
            </div>
            <h2 className='text-4xl font-bold text-white leading-[1.15] mb-4'>
              Start shortening
              <br />
              <span className='bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent'>
                links for free.
              </span>
            </h2>
            <p className='text-white/50 text-base leading-relaxed mb-10 max-w-xs'>
              Create an account in seconds and unlock powerful link management
              tools.
            </p>
            <div className='space-y-3'>
              {perks.map((perk) => (
                <div key={perk} className='flex items-center gap-3'>
                  <div className='size-5 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0'>
                    <Check className='size-3 text-violet-300' />
                  </div>
                  <span className='text-white/70 text-sm'>{perk}</span>
                </div>
              ))}
            </div>
          </div>
          <p className='relative mt-8 text-white/20 text-xs'>
            © {new Date().getFullYear()} Shortify. All rights reserved.
          </p>
        </div>
      </div>
      <div className='flex-1 flex flex-col'>
        <div className='flex items-center justify-between px-6 pt-6 lg:px-10'>
          <Link href='/' className='lg:hidden flex items-center gap-2'>
            <div className='size-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
              <Link2 className='size-3.5' />
            </div>
            <span className='font-bold'>Shortify</span>
          </Link>
          <div className='hidden lg:block' />
          <p className='text-sm text-muted-foreground'>
            Already have an account?{' '}
            <Link
              href='/login'
              className='font-medium text-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors'
            >
              Sign in →
            </Link>
          </p>
        </div>
        <div className='flex-1 flex items-center justify-center px-6 py-12'>
          <div className='w-full max-w-[400px]'>
            <div className='mb-8'>
              <h1 className='text-[28px] font-bold tracking-tight mb-1.5'>
                Create your account
              </h1>
              <p className='text-muted-foreground text-sm'>
                Free forever. No credit card required.
              </p>
            </div>
            <RegisterForm />
            <div className='relative my-6'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-border' />
              </div>
              <div className='relative flex justify-center'>
                <span className='bg-background px-3 text-xs text-muted-foreground'>
                  By signing up, you agree to our
                </span>
              </div>
            </div>
            <p className='text-center text-xs text-muted-foreground'>
              <Link
                href='/terms'
                className='hover:text-foreground underline underline-offset-4 transition-colors'
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href='/privacy'
                className='hover:text-foreground underline underline-offset-4 transition-colors'
              >
                Privacy Policy
              </Link>
            </p>
            <p className='text-center text-sm text-muted-foreground mt-6'>
              Already have an account?{' '}
              <Link
                href='/login'
                className='font-medium text-violet-600 dark:text-violet-400 hover:underline underline-offset-4'
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
