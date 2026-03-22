import { SeedDatabaseButton } from '@/components/admin/seed-database-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, Database, RefreshCcw } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Database Management | Admin | ShortLink',
  description: 'Database management tools for ShortLink application',
};

export default function DatabasePage() {
  return (
    <>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Database Management
          </h1>
          <p className='text-muted-foreground text-sm mt-1'>
            Development tools for managing test data
          </p>
        </div>
      </div>

      <div className='grid gap-6'>
        <Card className='shadow-sm border-border/60 rounded-2xl'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <div className='p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'>
                <Database className='size-5' />
              </div>
              <div>
                <CardTitle>Seed Database</CardTitle>
                <CardDescription className='mt-0.5'>
                  Populate the database with test data for development and
                  testing
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Warning banner — icon and text in the same flex row (fix #1) */}
            <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3'>
              <AlertTriangle className='size-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0' />
              <div>
                <h3 className='font-medium text-amber-800 dark:text-amber-300 mb-1'>
                  Development Use Only
                </h3>
                <p className='text-sm text-amber-700 dark:text-amber-400'>
                  This tool is intended for development and testing purposes
                  only. Seeding the database will create test users, URLs, and
                  other data.
                </p>
              </div>
            </div>

            <div className='bg-muted/50 border border-border/60 p-4 rounded-xl'>
              <h3 className='font-medium mb-2 flex items-center gap-2 text-foreground'>
                <RefreshCcw className='size-4 text-violet-600 dark:text-violet-400' />
                Seed Database with Test Data
              </h3>
              <p className='text-sm text-muted-foreground mb-4'>
                This will create test users including an admin user
                (admin@example.com / admin123), sample URLs, and other test data
                needed for development.
              </p>
              <SeedDatabaseButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
