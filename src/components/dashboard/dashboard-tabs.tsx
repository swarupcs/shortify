'use client';

import { cn } from '@/lib/utils';
import { BarChart3, Key, Link2, Layers, Users } from 'lucide-react';

export type TabId = 'links' | 'analytics' | 'bulk' | 'bio' | 'settings';

interface DashboardTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  linkCount?: number;
}

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'links', label: 'My Links', icon: <Link2 className='size-3.5' /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className='size-3.5' /> },
  { id: 'bulk', label: 'Bulk Shorten', icon: <Layers className='size-3.5' /> },
  { id: 'bio', label: 'Link in Bio', icon: <Users className='size-3.5' /> },
  { id: 'settings', label: 'Settings', icon: <Key className='size-3.5' /> },
];

export function DashboardTabs({ activeTab, onTabChange, linkCount }: DashboardTabsProps) {
  return (
    <div className='flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/60 w-full overflow-x-auto'>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center',
            activeTab === tab.id
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/60',
          )}
        >
          {tab.icon}
          <span className='hidden sm:inline'>{tab.label}</span>
          {tab.id === 'links' && linkCount !== undefined && linkCount > 0 && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full font-medium',
              activeTab === 'links'
                ? 'bg-white/20 text-white'
                : 'bg-muted text-muted-foreground',
            )}>
              {linkCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
