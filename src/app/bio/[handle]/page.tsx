import { getBioPageByHandle } from '@/server/actions/bio/bio-actions';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  ExternalLink,
  Link2,
  Globe,
  Twitter,
  Github,
  Linkedin,
  Instagram,
} from 'lucide-react';
import { notFound } from 'next/navigation';

type Params = Promise<{ handle: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { handle } = await params;
  const response = await getBioPageByHandle(handle);

  if (!response.success || !response.data) {
    return { title: 'Page not found | Shortify' };
  }

  const page = response.data;
  return {
    title: `${page.profileName || handle} | Shortify Bio`,
    description: page.profileBio || `Check out ${page.profileName || handle}'s links`,
  };
}

const THEMES: Record<string, string> = {
  violet: 'from-violet-600 to-fuchsia-600',
  ocean: 'from-blue-600 to-cyan-500',
  forest: 'from-emerald-600 to-teal-500',
  sunset: 'from-orange-500 to-rose-600',
  midnight: 'from-slate-900 to-slate-700',
};

const ICON_MAP: Record<string, React.ReactNode> = {
  link: <Link2 className='size-4' />,
  twitter: <Twitter className='size-4' />,
  github: <Github className='size-4' />,
  linkedin: <Linkedin className='size-4' />,
  instagram: <Instagram className='size-4' />,
  globe: <Globe className='size-4' />,
};

export default async function BioPage({ params }: { params: Params }) {
  const { handle } = await params;
  const response = await getBioPageByHandle(handle);

  if (!response.success || !response.data) {
    notFound();
  }

  const page = response.data;
  const gradient = THEMES[page.theme] || THEMES.violet;
  const initials = (page.profileName || handle).charAt(0).toUpperCase();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient}`}>
      <div className='max-w-sm mx-auto px-4 py-12'>

        {/* Profile */}
        <div className='text-center mb-8'>
          <div className='size-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 border border-white/20'>
            {initials}
          </div>
          <h1 className='text-white font-bold text-xl mb-1'>
            {page.profileName || handle}
          </h1>
          {page.profileBio && (
            <p className='text-white/70 text-sm leading-relaxed max-w-xs mx-auto'>
              {page.profileBio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className='space-y-3'>
          {page.links.length === 0 ? (
            <div className='text-center text-white/40 text-sm py-8'>
              No links added yet.
            </div>
          ) : (
            page.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 active:scale-[0.98] transition-all duration-150'
              >
                <div className='size-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0'>
                  {ICON_MAP[link.icon] || <Link2 className='size-4' />}
                </div>
                <span className='text-sm font-medium flex-1 text-left truncate'>
                  {link.title || 'Untitled'}
                </span>
                <ExternalLink className='size-3.5 opacity-50 shrink-0' />
              </a>
            ))
          )}
        </div>

        {/* Powered by footer */}
        <div className='mt-10 text-center'>
          <Link
            href='/'
            className='inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors'
          >
            <div className='size-4 rounded bg-white/20 flex items-center justify-center'>
              <Link2 className='size-2.5' />
            </div>
            Made with Shortify
          </Link>
        </div>
      </div>
    </div>
  );
}
