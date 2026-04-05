import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Globe,
  Link2,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { db } from '@/server/db';
import { urls } from '@/server/db/schema';
import { sql } from 'drizzle-orm';

const features = [
  {
    icon: <Zap className='size-5' />,
    title: 'Instant Shortening',
    description: 'Generate short links in milliseconds with AI safety checks.',
    accent:
      'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  },
  {
    icon: <Shield className='size-5' />,
    title: 'AI Safety Scan',
    description: 'Every URL analyzed by Gemini AI to protect your users.',
    accent:
      'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: <BarChart3 className='size-5' />,
    title: 'Click Analytics',
    description: 'Track performance with real-time click counts.',
    accent: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  },
  {
    icon: <Globe className='size-5' />,
    title: 'Custom Codes',
    description: 'Brand your links with memorable short codes.',
    accent:
      'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
  },
];



export default async function Home() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  const [{ totalUrls }] = await db.select({ totalUrls: sql<number>`count(*)::int` }).from(urls);
  const [{ totalClicks }] = await db.select({ totalClicks: sql<number>`coalesce(sum(${urls.clicks}), 0)::int` }).from(urls);

  const formatNumber = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M+` : n >= 1000 ? `${(n/1000).toFixed(1)}k+` : n.toString();

  const stats = [
    { label: 'Links Shortened', value: formatNumber(totalUrls) },
    { label: 'Clicks Tracked', value: formatNumber(totalClicks) },
    { label: 'Uptime', value: '99.9%' },
  ];

  return (
    <div className='relative overflow-hidden'>
      <div
        className='absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.06]'
        style={{
          backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px),
                            linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <div className='absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 dark:from-violet-500/20 dark:via-fuchsia-500/15 dark:to-pink-500/10 blur-3xl -z-10' />

      <section className='container max-w-5xl mx-auto px-4 pt-20 pb-16 text-center'>
        <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 text-sm font-medium mb-8'>
          <Sparkles className='size-3.5' />
          AI-Powered URL Safety
        </div>
        <h1 className='text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]'>
          <span className='bg-gradient-to-br from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent'>
            Shorten. Share.
          </span>
          <br />
          <span className='bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>
            Stay Safe.
          </span>
        </h1>
        <p className='text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed'>
          Transform long URLs into powerful short links. Every link is scanned
          by AI to keep you and your users safe from malicious content.
        </p>
        <div className='flex flex-col sm:flex-row items-center justify-center gap-4 mb-6'>
          <Link
            href='/login'
            className='group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold text-base shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 hover:-translate-y-0.5'
          >
            <Link2 className='size-5' />
            Sign in to get started
            <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
          </Link>
          <Link
            href='/register'
            className='inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-border/60 bg-background hover:bg-muted/60 text-foreground font-semibold text-base transition-all duration-200 hover:-translate-y-0.5'
          >
            Create free account
          </Link>
        </div>
        <p className='text-sm text-muted-foreground'>
          Free forever. No credit card required.{' '}
          <Link
            href='/stats'
            className='text-violet-600 dark:text-violet-400 hover:underline underline-offset-4'
          >
            View public stats →
          </Link>
        </p>
      </section>

      <section className='border-y border-border/50 bg-muted/30'>
        <div className='container max-w-5xl mx-auto px-4 py-6'>
          <div className='grid grid-cols-3 divide-x divide-border/50'>
            {stats.map((stat) => (
              <div key={stat.label} className='text-center px-4'>
                <p className='text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent'>
                  {stat.value}
                </p>
                <p className='text-sm text-muted-foreground mt-1'>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='container max-w-5xl mx-auto px-4 py-20'>
        <div className='text-center mb-14'>
          <h2 className='text-3xl md:text-4xl font-bold mb-4'>
            Everything you need
          </h2>
          <p className='text-muted-foreground max-w-xl mx-auto'>
            From instant shortening to deep analytics, Shortify has all the
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
            Join thousands of users who trust Shortify to manage their links
            safely.
          </p>
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <Link
              href='/login'
              className='inline-flex items-center gap-2 px-6 py-3 bg-white text-violet-700 font-semibold rounded-xl hover:bg-white/90 transition-colors'
            >
              Sign in <ArrowRight className='size-4' />
            </Link>
            <Link
              href='/register'
              className='inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20'
            >
              Create free account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
