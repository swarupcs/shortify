import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Loader2, Link2, Shield, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Zap,
    title: 'Instant shortening',
    desc: 'Get a short link in under a second',
  },
  {
    icon: Shield,
    title: 'AI safety scanning',
    desc: 'Every URL checked by Gemini AI',
  },
  {
    icon: BarChart3,
    title: 'Click analytics',
    desc: 'Track every click in real time',
  },
];

export default function LoginPage() {
  return (
    <div className='min-h-screen flex bg-background'>
      {/* ── Left branding panel ── */}
      <div className='hidden lg:flex flex-col w-[520px] shrink-0 relative overflow-hidden bg-[#0f0a1e]'>
        {/* Gradient orbs */}
        <div className='absolute top-[-120px] left-[-80px] w-[420px] h-[420px] rounded-full bg-violet-700/40 blur-[100px] pointer-events-none' />
        <div className='absolute bottom-[-80px] right-[-60px] w-[320px] h-[320px] rounded-full bg-fuchsia-700/30 blur-[80px] pointer-events-none' />

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
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/60 text-xs mb-6'>
              <span className='size-1.5 rounded-full bg-emerald-400 animate-pulse' />
              Trusted by thousands of users
            </div>

            <h2 className='text-4xl font-bold text-white leading-[1.15] mb-4'>
              Your links,
              <br />
              <span className='bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent'>
                smarter &amp; safer.
              </span>
            </h2>
            <p className='text-white/50 text-base leading-relaxed mb-10 max-w-xs'>
              Shorten, track, and protect your links with AI-powered safety
              scanning — all in one place.
            </p>

            {/* Feature list */}
            <div className='space-y-3'>
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className='flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/[0.08] backdrop-blur-sm'
                >
                  <div className='size-9 rounded-xl bg-violet-500/20 border border-violet-400/20 flex items-center justify-center shrink-0'>
                    <Icon className='size-4 text-violet-300' />
                  </div>
                  <div>
                    <p className='text-white text-sm font-medium'>{title}</p>
                    <p className='text-white/40 text-xs mt-0.5'>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className='relative mt-10 text-white/20 text-xs'>
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
            No account?{' '}
            <Link
              href='/register'
              className='font-medium text-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors'
            >
              Sign up free →
            </Link>
          </p>
        </div>

        {/* Form */}
        <div className='flex-1 flex items-center justify-center px-6 py-12'>
          <div className='w-full max-w-[400px]'>
            <div className='mb-8'>
              <h1 className='text-[28px] font-bold tracking-tight mb-1.5'>
                Welcome back
              </h1>
              <p className='text-muted-foreground text-sm'>
                Sign in to your account to continue managing your links.
              </p>
            </div>

            <Suspense
              fallback={
                <div className='flex justify-center py-16'>
                  <Loader2 className='size-5 animate-spin text-muted-foreground' />
                </div>
              }
            >
              <LoginForm />
            </Suspense>

            <p className='text-center text-sm text-muted-foreground mt-8'>
              Don&apos;t have an account?{' '}
              <Link
                href='/register'
                className='font-medium text-violet-600 dark:text-violet-400 hover:underline underline-offset-4'
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
