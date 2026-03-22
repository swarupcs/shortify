'use client';

import { cn } from '@/lib/utils';
import { BarChart3, Link2, Upload, User } from 'lucide-react';
import type { TabId } from '@/app/(user)/dashboard/page';

interface DashboardTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  linkCount: number;
}

const tabs: {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: 'links',
    label: 'My Links',
    icon: <Link2 className='size-4' />,
    description: 'Manage your shortened URLs',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className='size-4' />,
    description: 'Click stats and charts',
  },
  {
    id: 'bulk',
    label: 'Bulk Shorten',
    icon: <Upload className='size-4' />,
    description: 'Shorten up to 20 URLs at once',
  },
  {
    id: 'bio',
    label: 'Link in Bio',
    icon: <User className='size-4' />,
    description: 'Build a personal landing page',
  },
];

export function DashboardTabs({
  activeTab,
  onTabChange,
  linkCount,
}: DashboardTabsProps) {
  return (
    <div className='border border-border/60 rounded-2xl bg-card overflow-hidden'>
      <div className='flex overflow-x-auto scrollbar-hide'>
        {tabs.map((tab, i) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all duration-150 border-b-2 flex-1 justify-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-inset',
                isActive
                  ? 'border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-900/20'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40',
                i !== 0 && 'border-l border-l-border/60',
              )}
              aria-selected={isActive}
              role='tab'
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'links' && linkCount > 0 && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 text-xs rounded-full font-normal tabular-nums',
                    isActive
                      ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {linkCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
