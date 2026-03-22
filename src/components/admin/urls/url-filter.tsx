'use client';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Flag, FlagIcon, ShieldIcon } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface UrlFilterProps { initialFilter: string; }

export function UrlFilter({ initialFilter }: UrlFilterProps) {
  const router = useRouter(); const searchParams = useSearchParams(); const pathname = usePathname();
  const createQueryString = useCallback((name: string, value: string) => { const params = new URLSearchParams(searchParams.toString()); params.set('page', '1'); params.set(name, value); return params.toString(); }, [searchParams]);
  const handleFilterChange = (filter: string) => { router.push(`${pathname}?${createQueryString('filter', filter)}`); };
  return (
    <div className='flex flex-wrap gap-2 mb-4'>
      <Button variant={initialFilter==='all'?'default':'outline'} size='sm' onClick={() => handleFilterChange('all')} className={initialFilter==='all' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0' : 'border-border/60 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400'}>All URLs</Button>
      <Button variant={initialFilter==='flagged'?'secondary':'outline'} size='sm' onClick={() => handleFilterChange('flagged')} className={initialFilter==='flagged' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' : 'border-border/60 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600 dark:hover:text-amber-400'}><FlagIcon className='size-4 mr-1.5' />All Flagged</Button>
      <Button variant={initialFilter==='security'?'secondary':'outline'} size='sm' onClick={() => handleFilterChange('security')} className={initialFilter==='security' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' : 'border-border/60 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400'}><ShieldIcon className='size-4 mr-1.5' />Security Risks</Button>
      <Button variant={initialFilter==='inappropriate'?'secondary':'outline'} size='sm' onClick={() => handleFilterChange('inappropriate')} className={initialFilter==='inappropriate' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' : 'border-border/60 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-600 dark:hover:text-orange-400'}><AlertTriangle className='size-4 mr-1.5' />Inappropriate</Button>
      <Button variant={initialFilter==='other'?'secondary':'outline'} size='sm' onClick={() => handleFilterChange('other')} className={initialFilter==='other' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' : 'border-border/60 hover:border-yellow-300 dark:hover:border-yellow-700 hover:text-yellow-600 dark:hover:text-yellow-400'}><Flag className='size-4 mr-1.5' />Other Flags</Button>
    </div>
  );
}
