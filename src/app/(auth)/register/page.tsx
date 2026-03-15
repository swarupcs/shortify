
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
      {/* ── Left branding panel ── */}
      <div className='hidden lg:flex flex-col w-[520px] shrink-0 relative overflow-hidden bg-[#0f0a1e]'>
        {/* Gradient orbs */}
        <div className='absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-fuchsia-700/35 blur-[100px] pointer-events-none' />
        <div className='absolute bottom-[-60px] left-[-80px] w-[300px] h-[300px] rounded-full bg-violet-700/30 blur-[80px] pointer-events-none' />

        {/* Dot grid */}
        <div
          className='absolute inset-0 opacity-[0.07] pointer-events-none'
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Content */}
        <div className='relative z-10 flex flex-col h-full p-12'>
          {/* Logo */}
          <Link href='/' className='flex items-center gap-3 w-fit group'>
            <div className='size-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/15 transition-colors'>
              <Link2 className='size-4 text-white' />
            </div>
            <span className='text-white font-bold text-lg'>ShortLink</span>
          </Link>

          {/* Main copy */}
          <div className='mt-auto'>
            {/* Badge */}
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

            {/* Perks */}
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

            {/* Social proof */}
            <div className='mt-10 p-4 rounded-2xl bg-white/5 border border-white/[0.08]'>
              <div className='flex items-center gap-3 mb-2'>
                <div className='flex -space-x-2'>
                  {['V', 'A', 'M', 'R'].map((initial, i) => (
                    <div
                      key={i}
                      className='size-7 rounded-full border-2 border-[#0f0a1e] flex items-center justify-center text-xs font-bold text-white'
                      style={{
                        background: [
                          '#7c3aed',
                          '#a855f7',
                          '#c026d3',
                          '#9333ea',
                        ][i],
                      }}
                    >
                      {initial}
                    </div>
                  ))}
                </div>
                <div className='flex gap-0.5'>
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className='size-3 text-amber-400 fill-current'
                      viewBox='0 0 20 20'
                    >
                      <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                    </svg>
                  ))}
                </div>
              </div>
              <p className='text-white/40 text-xs leading-relaxed'>
                &ldquo;ShortLink is the cleanest URL shortener I&apos;ve used.
                The AI safety scan gives me real peace of mind.&rdquo;
              </p>
            </div>
          </div>

          <p className='relative mt-8 text-white/20 text-xs'>
            © {new Date().getFullYear()} ShortLink. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className='flex-1 flex flex-col'>
        {/* Top bar */}
        <div className='flex items-center justify-between px-6 pt-6 lg:px-10'>
          <Link href='/' className='lg:hidden flex items-center gap-2'>
            <div className='size-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white'>
              <Link2 className='size-3.5' />
            </div>
            <span className='font-bold'>ShortLink</span>
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

        {/* Form */}
        <div className='flex-1 flex items-center justify-center px-6 py-12'>
          <div className='w-full max-w-[400px]'>
            {/* Heading */}
            <div className='mb-8'>
              <h1 className='text-[28px] font-bold tracking-tight mb-1.5'>
                Create your account
              </h1>
              <p className='text-muted-foreground text-sm'>
                Free forever. No credit card required.
              </p>
            </div>

            <RegisterForm />

            {/* Divider */}
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
