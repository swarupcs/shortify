import { UrlShortenerForm } from '@/components/urls/url-shortener-form';
import {
  ArrowRight,
  BarChart3,
  Globe,
  Shield,
  Zap,
  Link2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';

const features = [
  {
    icon: <Zap className='size-5' />,
    title: 'Instant Shortening',
    description:
      'Generate short links in milliseconds with AI-powered safety checks.',
    accent:
      'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  },
  {
    icon: <Shield className='size-5' />,
    title: 'AI Safety Scan',
    description:
      'Every URL is analyzed by Gemini AI before shortening to protect users.',
    accent:
      'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: <BarChart3 className='size-5' />,
    title: 'Click Analytics',
    description:
      'Track performance with real-time click counts and engagement metrics.',
    accent: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  },
  {
    icon: <Globe className='size-5' />,
    title: 'Custom Codes',
    description: 'Brand your links with memorable custom short codes.',
    accent:
      'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
  },
];

export default async function Home() {
  const session = await auth();

  // Redirect authenticated users straight to their dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className='relative overflow-hidden'>
      {/* Background grid pattern */}
      <div
        className='absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.07]'
        style={{
          backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Hero gradient blob */}
      <div className='absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 dark:from-violet-500/20 dark:via-fuchsia-500/15 dark:to-pink-500/10 blur-3xl -z-10' />

      {/* Hero */}
      <section className='container max-w-5xl mx-auto px-4 pt-20 pb-16 text-center'>
        <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 text-sm font-medium mb-8'>
          <Sparkles className='size-3.5' />
          AI-Powered URL Safety
        </div>

        <h1 className='text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent leading-[1.1]'>
          Shorten. Share.
          <br />
          <span className='bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>
            Stay Safe.
          </span>
        </h1>

        <p className='text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed'>
          Transform long URLs into powerful short links. Every link is scanned
          by AI to keep you and your users safe from malicious content.
        </p>

        <div className='max-w-2xl mx-auto'>
          <UrlShortenerForm />
        </div>

        <p className='mt-6 text-sm text-muted-foreground'>
          No account needed to get started.{' '}
          <Link
            href='/register'
            className='text-violet-600 dark:text-violet-400 hover:underline font-medium'
          >
            Sign up free
          </Link>{' '}
          to save and track links.
        </p>
      </section>

      {/* Stats bar */}
      <section className='border-y border-border/50 bg-muted/30'>
        <div className='container max-w-5xl mx-auto px-4 py-6'>
          <div className='grid grid-cols-3 divide-x divide-border/50'>
            {[
              { label: 'Links Shortened', value: '1M+' },
              { label: 'Clicks Tracked', value: '50M+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className='text-center px-4'>
                <p className='text-2xl md:text-3xl font-bold'>{stat.value}</p>
                <p className='text-sm text-muted-foreground mt-1'>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='container max-w-5xl mx-auto px-4 py-20'>
        <div className='text-center mb-14'>
          <h2 className='text-3xl md:text-4xl font-bold mb-4'>
            Everything you need
          </h2>
          <p className='text-muted-foreground max-w-xl mx-auto'>
            From instant shortening to deep analytics, ShortLink has all the
            tools to manage your links effectively.
          </p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {features.map((feature) => (
            <div
              key={feature.title}
              className='group p-6 rounded-2xl border border-border/50 bg-card hover:border-border hover:shadow-md transition-all duration-200'
            >
              <div
                className={`inline-flex p-2.5 rounded-xl mb-4 ${feature.accent}`}
              >
                {feature.icon}
              </div>
              <h3 className='font-semibold mb-2'>{feature.title}</h3>
              <p className='text-sm text-muted-foreground leading-relaxed'>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className='container max-w-5xl mx-auto px-4 pb-24'>
        <div className='relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 to-fuchsia-700 dark:from-violet-800 dark:to-fuchsia-900 p-12 text-center text-white'>
          <div
            className='absolute inset-0 opacity-10 pointer-events-none'
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />
          <Link2 className='size-10 mx-auto mb-4 opacity-80' />
          <h2 className='text-3xl font-bold mb-3'>Ready to get started?</h2>
          <p className='text-white/70 mb-8 max-w-md mx-auto'>
            Join thousands of users who trust ShortLink to manage their links
            safely.
          </p>
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <Link
              href='/register'
              className='inline-flex items-center gap-2 px-6 py-3 bg-white text-violet-700 font-semibold rounded-xl hover:bg-white/90 transition-colors'
            >
              Create Free Account
              <ArrowRight className='size-4' />
            </Link>
            <Link
              href='/stats'
              className='inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20'
            >
              View Public Stats
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
