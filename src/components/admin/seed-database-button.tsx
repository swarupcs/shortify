'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { seedDatabase } from '@/server/actions/admin/seed-database';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCcw } from 'lucide-react';

export function SeedDatabaseButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const handleSeed = async () => {
    if (!confirm('Are you sure you want to seed the database with test data?')) return;
    setIsLoading(true);
    try {
      const response = await seedDatabase();
      if (response.success) { toast.success('Database seeded successfully'); router.refresh(); }
      else { toast.error('Seeding failed', { description: response.error || 'Failed to seed database' }); }
    } catch (error) { console.error('Error seeding database:', error); toast.error('Unexpected error'); }
    finally { setIsLoading(false); }
  };
  return (
    <Button onClick={handleSeed} disabled={isLoading} className='bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0'>
      {isLoading ? <><Loader2 className='mr-2 size-4 animate-spin' />Seeding...</> : <><RefreshCcw className='mr-2 size-4' />Seed Database</>}
    </Button>
  );
}
