'use server';
import { seed } from '@/server/db/seed';
import { ApiResponse } from '@/lib/types';
import { auth } from '@/server/auth';
import { revalidatePath } from 'next/cache';

export async function seedDatabase(): Promise<ApiResponse<null>> {
  try {
    if (process.env.NODE_ENV !== 'development') return { success: false, error: 'This action is only available in development mode' };
    const session = await auth();
    if (!session?.user) return { success: false, error: 'You must be logged in to perform this action' };
    if (session.user.role !== 'admin') return { success: false, error: 'You must have admin privileges to perform this action' };
    const result = await seed();
    if (!result.success) return { success: false, error: 'Failed to seed database' };
    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true, data: null };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
