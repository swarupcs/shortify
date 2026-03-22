'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Loader2,
  Save,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  saveBioPage,
  getUserBioPage,
  checkHandleAvailability,
  type BioLink,
} from '@/server/actions/bio/bio-actions';
import { useSession } from 'next-auth/react';

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

type HandleStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function LinkInBioTab() {
  const { data: session } = useSession();

  // Form state
  const [handle, setHandle] = useState('');
  const [profileName, setProfileName] = useState('Your Name');
  const [profileBio, setProfileBio] = useState('Welcome to my links!');
  const [selectedTheme, setSelectedTheme] = useState('violet');
  const [links, setLinks] = useState<BioLink[]>([
    { id: '1', title: 'My Website', url: 'https://example.com', icon: 'globe' },
    { id: '2', title: 'GitHub', url: 'https://github.com', icon: 'github' },
  ]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savedHandle, setSavedHandle] = useState<string | null>(null);
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('idle');
  const [handleCheckTimer, setHandleCheckTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const theme = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  // Load existing bio page on mount
  useEffect(() => {
    getUserBioPage().then((res) => {
      if (res.success && res.data) {
        const p = res.data;
        setHandle(p.handle);
        setSavedHandle(p.handle);
        setProfileName(p.profileName || 'Your Name');
        setProfileBio(p.profileBio || 'Welcome to my links!');
        setSelectedTheme(p.theme || 'violet');
        setLinks(p.links.length > 0 ? p.links : [
          { id: '1', title: 'My Website', url: 'https://example.com', icon: 'globe' },
        ]);
      }
      setIsLoading(false);
    });
  }, []);

  // Live handle validation with debounce
  const validateHandle = useCallback((value: string) => {
    if (handleCheckTimer) clearTimeout(handleCheckTimer);

    if (!value) { setHandleStatus('idle'); return; }

    const handleRegex = /^[a-z0-9_-]+$/;
    if (value.length < 3 || !handleRegex.test(value)) {
      setHandleStatus('invalid');
      return;
    }

    // If same as already-saved handle, it's always available for this user
    if (value === savedHandle) {
      setHandleStatus('available');
      return;
    }

    setHandleStatus('checking');
    const timer = setTimeout(async () => {
      const { available } = await checkHandleAvailability(value);
      setHandleStatus(available ? 'available' : 'taken');
    }, 500);
    setHandleCheckTimer(timer);
  }, [handleCheckTimer, savedHandle]);

  const handleHandleChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setHandle(cleaned);
    validateHandle(cleaned);
  };

  const addLink = () =>
    setLinks((prev) => [
      ...prev,
      { id: Date.now().toString(), title: 'New Link', url: 'https://', icon: 'link' },
    ]);

  const removeLink = (id: string) =>
    setLinks((prev) => prev.filter((l) => l.id !== id));

  const updateLink = (id: string, field: keyof BioLink, value: string) =>
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  const handleSave = async () => {
    if (!handle || handle.length < 3) {
      toast.error('Please set a handle (at least 3 characters)');
      return;
    }
    if (handleStatus === 'taken') {
      toast.error('That handle is already taken');
      return;
    }
    if (handleStatus === 'invalid') {
      toast.error('Handle can only contain lowercase letters, numbers, hyphens and underscores');
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveBioPage({
        handle,
        profileName,
        profileBio,
        theme: selectedTheme,
        links,
      });

      if (result.success) {
        setSavedHandle(handle);
        setHandleStatus('available');
        toast.success('Bio page saved!', {
          description: `Live at ${window.location.origin}/bio/${handle}`,
        });
      } else {
        toast.error('Failed to save', { description: result.error });
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!savedHandle) {
      toast.error('Save your bio page first to get a shareable link');
      return;
    }
    const url = `${window.location.origin}/bio/${savedHandle}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusInfo = () => {
    if (!handle) return null;
    if (handleStatus === 'checking') return (
      <span className='flex items-center gap-1 text-xs text-muted-foreground'>
        <Loader2 className='size-3 animate-spin' /> Checking…
      </span>
    );
    if (handleStatus === 'available') return (
      <span className='flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400'>
        <Check className='size-3' /> Available
      </span>
    );
    if (handleStatus === 'taken') return (
      <span className='flex items-center gap-1 text-xs text-destructive'>
        <AlertCircle className='size-3' /> Already taken
      </span>
    );
    if (handleStatus === 'invalid') return (
      <span className='flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400'>
        <AlertCircle className='size-3' /> Lowercase letters, numbers, - and _ only
      </span>
    );
    return null;
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center py-20'>
        <Loader2 className='size-6 animate-spin text-violet-600 dark:text-violet-400' />
      </div>
    );
  }

  return (
    <div className='flex flex-col md:flex-row gap-6'>
      {/* ── Editor ── */}
      <div className='flex-1 space-y-4'>

        {/* Handle */}
        <Card className='border-border/60 rounded-2xl'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm'>Your public handle</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            <div className='flex items-center rounded-xl border border-border/60 bg-muted/30 overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-400 transition-all'>
              <span className='text-xs text-muted-foreground px-3 py-2 border-r border-border/60 bg-muted/50 whitespace-nowrap shrink-0'>
                {typeof window !== 'undefined' ? window.location.origin : ''}/bio/
              </span>
              <Input
                value={handle}
                onChange={(e) => handleHandleChange(e.target.value)}
                placeholder='your-handle'
                maxLength={30}
                className='border-0 bg-transparent focus-visible:ring-0 rounded-none text-sm h-9'
              />
            </div>
            <div className='flex items-center justify-between'>
              {handleStatusInfo()}
              <span className='text-xs text-muted-foreground ml-auto'>{handle.length}/30</span>
            </div>
            {savedHandle && (
              <a
                href={`/bio/${savedHandle}`}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline underline-offset-4 w-fit'
              >
                View live page <ExternalLink className='size-3' />
              </a>
            )}
          </CardContent>
        </Card>

        {/* Profile */}
        <Card className='border-border/60 rounded-2xl'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm'>Profile</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='size-14 rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0'>
                {(profileName || 'Y').charAt(0).toUpperCase()}
              </div>
              <div className='flex-1 space-y-2'>
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder='Your name'
                  maxLength={100}
                  className='h-8 text-sm'
                />
                <Input
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder='Short bio'
                  maxLength={300}
                  className='h-8 text-sm'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
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
                  <span className={`size-3 rounded-full bg-gradient-to-br ${t.bg}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card className='border-border/60 rounded-2xl'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm'>Links</CardTitle>
              <Button variant='outline' size='sm' className='h-7 text-xs gap-1' onClick={addLink}>
                <Plus className='size-3' />
                Add Link
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-3'>
            {links.map((link) => (
              <div key={link.id} className='flex items-center gap-2 p-2 rounded-xl border border-border/60 bg-muted/20'>
                <GripVertical className='size-4 text-muted-foreground/40 shrink-0' />
                <select
                  value={link.icon}
                  onChange={(e) => updateLink(link.id, 'icon', e.target.value)}
                  className='h-7 text-xs bg-background border border-border rounded-lg px-1 shrink-0'
                >
                  {Object.keys(ICON_MAP).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <div className='flex-1 min-w-0 space-y-1.5'>
                  <Input
                    value={link.title}
                    onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                    placeholder='Link title'
                    maxLength={100}
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
                No links yet. Add one above.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className='flex gap-3'>
          <Button
            onClick={handleSave}
            disabled={isSaving || handleStatus === 'taken' || handleStatus === 'invalid' || handleStatus === 'checking'}
            className='flex-1 gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'
          >
            {isSaving ? (
              <><Loader2 className='size-4 animate-spin' />Saving…</>
            ) : (
              <><Save className='size-4' />Save & Publish</>
            )}
          </Button>
          <Button
            variant='outline'
            onClick={handleCopy}
            disabled={!savedHandle}
            className='gap-2 border-border/60'
            title={savedHandle ? `Copy /bio/${savedHandle}` : 'Save first to get a shareable link'}
          >
            {copied ? <Check className='size-4 text-emerald-600' /> : <Copy className='size-4' />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>

        {!savedHandle && (
          <p className='text-xs text-muted-foreground text-center'>
            Set a handle and click &ldquo;Save &amp; Publish&rdquo; to make your page live.
          </p>
        )}
      </div>

      {/* ── Live Preview ── */}
      <div className='md:w-72 shrink-0'>
        <div className='sticky top-20'>
          <p className='text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide'>
            Preview
          </p>
          <div className='rounded-3xl overflow-hidden border border-border/60 shadow-lg'>
            <div className={`bg-gradient-to-br ${theme.bg} p-6 min-h-[480px]`}>
              <div className='text-center mb-6'>
                <div className='size-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3'>
                  {(profileName || 'Y').charAt(0).toUpperCase()}
                </div>
                <h2 className='text-white font-bold text-lg'>{profileName || 'Your Name'}</h2>
                <p className='text-white/70 text-xs mt-1'>{profileBio || 'Your bio'}</p>
              </div>
              <div className='space-y-2.5'>
                {links.map((link) => (
                  <div
                    key={link.id}
                    className='flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-white'
                  >
                    <div className='size-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0'>
                      {ICON_MAP[link.icon] || <Link2 className='size-4' />}
                    </div>
                    <span className='text-sm font-medium flex-1 truncate'>
                      {link.title || 'Untitled'}
                    </span>
                    <ExternalLink className='size-3.5 opacity-50 shrink-0' />
                  </div>
                ))}
                {links.length === 0 && (
                  <div className='text-center py-6 text-white/40 text-sm'>
                    Add links to preview
                  </div>
                )}
              </div>
            </div>
          </div>
          {savedHandle && (
            <a
              href={`/bio/${savedHandle}`}
              target='_blank'
              rel='noopener noreferrer'
              className='mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors'
            >
              <ExternalLink className='size-3' />
              Open live page
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
