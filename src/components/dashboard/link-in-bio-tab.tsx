'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ExternalLink,
  GripVertical,
  Link2,
  Plus,
  Trash2,
  Globe,
  Twitter,
  Github,
  Linkedin,
  Instagram,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  link: <Link2 className='size-4' />,
  twitter: <Twitter className='size-4' />,
  github: <Github className='size-4' />,
  linkedin: <Linkedin className='size-4' />,
  instagram: <Instagram className='size-4' />,
  globe: <Globe className='size-4' />,
};

const THEMES = [
  { id: 'violet', label: 'Violet', bg: 'from-violet-600 to-fuchsia-600' },
  { id: 'ocean', label: 'Ocean', bg: 'from-blue-600 to-cyan-500' },
  { id: 'forest', label: 'Forest', bg: 'from-emerald-600 to-teal-500' },
  { id: 'sunset', label: 'Sunset', bg: 'from-orange-500 to-rose-600' },
  { id: 'midnight', label: 'Midnight', bg: 'from-slate-900 to-slate-700' },
];

export function LinkInBioTab() {
  const [profileName, setProfileName] = useState('Your Name');
  const [profileBio, setProfileBio] = useState('Welcome to my links!');
  const [selectedTheme, setSelectedTheme] = useState('violet');
  const [links, setLinks] = useState<LinkItem[]>([
    { id: '1', title: 'My Website', url: 'https://example.com', icon: 'globe' },
    { id: '2', title: 'GitHub', url: 'https://github.com', icon: 'github' },
  ]);
  const [copied, setCopied] = useState(false);

  const theme = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  const addLink = () =>
    setLinks([
      ...links,
      { id: Date.now().toString(), title: 'New Link', url: 'https://', icon: 'link' },
    ]);

  const removeLink = (id: string) =>
    setLinks(links.filter((l) => l.id !== id));

  const updateLink = (id: string, field: keyof LinkItem, value: string) =>
    setLinks(links.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  const handleCopyShare = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/bio/your-handle`,
    );
    setCopied(true);
    toast.success('Share link copied! (Feature coming soon)');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='flex flex-col md:flex-row gap-6'>
      {/* Editor */}
      <div className='flex-1 space-y-4'>
        <Card className='border-border/60 rounded-2xl'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm'>Profile</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='size-14 rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white text-xl font-bold'>
                {profileName.charAt(0).toUpperCase()}
              </div>
              <div className='flex-1 space-y-2'>
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder='Your name'
                  className='h-8 text-sm'
                />
                <Input
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder='Short bio'
                  className='h-8 text-sm'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/60 rounded-2xl'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm'>Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex gap-2 flex-wrap'>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                    selectedTheme === t.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-600'
                      : 'border-border hover:border-border/80',
                  )}
                >
                  <span
                    className={`size-3 rounded-full bg-gradient-to-br ${t.bg}`}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/60 rounded-2xl'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm'>Links</CardTitle>
              <Button
                variant='outline'
                size='sm'
                className='h-7 text-xs gap-1'
                onClick={addLink}
              >
                <Plus className='size-3' />
                Add Link
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-3'>
            {links.map((link) => (
              <div
                key={link.id}
                className='flex items-center gap-2 p-2 rounded-xl border border-border/60 bg-muted/20'
              >
                <GripVertical className='size-4 text-muted-foreground/40 shrink-0' />
                <select
                  value={link.icon}
                  onChange={(e) => updateLink(link.id, 'icon', e.target.value)}
                  className='h-7 text-xs bg-background border border-border rounded-lg px-1 shrink-0'
                >
                  {Object.keys(ICON_MAP).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <div className='flex-1 min-w-0 space-y-1.5'>
                  <Input
                    value={link.title}
                    onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                    placeholder='Link title'
                    className='h-7 text-xs'
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                    placeholder='https://'
                    className='h-7 text-xs font-mono'
                  />
                </div>
                <button
                  onClick={() => removeLink(link.id)}
                  className='text-muted-foreground hover:text-destructive transition-colors shrink-0'
                >
                  <Trash2 className='size-4' />
                </button>
              </div>
            ))}
            {links.length === 0 && (
              <div className='text-center py-6 text-sm text-muted-foreground'>
                No links yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          className='w-full gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'
          onClick={handleCopyShare}
        >
          {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
          {copied ? 'Copied!' : 'Share Page'}
        </Button>
      </div>

      {/* Preview */}
      <div className='md:w-72 shrink-0'>
        <div className='sticky top-20'>
          <p className='text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide'>
            Preview
          </p>
          <div className='rounded-3xl overflow-hidden border border-border/60 shadow-lg'>
            <div
              className={`bg-gradient-to-br ${theme.bg} p-6 min-h-[480px]`}
            >
              <div className='text-center mb-6'>
                <div className='size-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3'>
                  {profileName.charAt(0).toUpperCase()}
                </div>
                <h2 className='text-white font-bold text-lg'>
                  {profileName || 'Your Name'}
                </h2>
                <p className='text-white/70 text-xs mt-1'>
                  {profileBio || 'Your bio'}
                </p>
              </div>
              <div className='space-y-2.5'>
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-colors'
                  >
                    <div className='size-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0'>
                      {ICON_MAP[link.icon] || <Link2 className='size-4' />}
                    </div>
                    <span className='text-sm font-medium flex-1 truncate'>
                      {link.title || 'Untitled'}
                    </span>
                    <ExternalLink className='size-3.5 opacity-50 shrink-0' />
                  </a>
                ))}
                {links.length === 0 && (
                  <div className='text-center py-6 text-white/40 text-sm'>
                    Add links to preview
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
