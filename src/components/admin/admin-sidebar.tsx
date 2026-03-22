'use client';
import { usePathname } from 'next/navigation';
import { getNavItems, NavItem } from './nav-items';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ChevronLeft } from 'lucide-react';

export function AdminSidebar() {
  const pathname = usePathname();
  const navItems = getNavItems();
  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    if (item.href === '/admin/urls' && pathname.includes('/admin/urls/flagged')) return false;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };
  return (
    <div className='hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-14 md:z-30 border-r border-border/60 bg-sidebar'>
      <div className='flex h-14 items-center border-b border-border/60 px-4 gap-2'>
        <div className='size-6 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center'><span className='text-white text-xs font-bold'>A</span></div>
        <h2 className='text-base font-semibold text-sidebar-foreground'>Admin Panel</h2>
      </div>
      <nav className='flex-1 overflow-auto py-4'>
        <ul className='space-y-0.5 px-2'>
          {navItems.map((item: NavItem) => (
            <li key={item.href}>
              <Link href={item.href} className={cn('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors', isActive(item) ? 'bg-violet-600 dark:bg-violet-700 text-white shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}>
                {item.icon}{item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className='border-t border-border/60 p-4'>
        <Link href='/dashboard'>
          <Button variant='outline' size='sm' className='w-full justify-start gap-2 border-border/60 text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700 transition-colors'>
            <ChevronLeft className='size-4' />Back to App
          </Button>
        </Link>
      </div>
    </div>
  );
}
