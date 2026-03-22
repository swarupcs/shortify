import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { ApiKeysTab } from '@/components/dashboard/api-keys-tab';
import { Key } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Settings | Dashboard | Shortify',
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div className='flex items-center gap-3'>
        <div className='size-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400'>
          <Key className='size-5' />
        </div>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Settings</h1>
          <p className='text-muted-foreground text-sm mt-0.5'>
            Manage your account preferences and API access
          </p>
        </div>
      </div>

      <ApiKeysTab />
    </div>
  );
}
