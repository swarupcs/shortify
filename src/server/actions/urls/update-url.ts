'use server';
import { ApiResponse } from '@/lib/types';
import { auth } from '@/server/auth';
import { db, eq } from '@/server/db';
import { urls } from '@/server/db/schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateUrlSchema = z.object({
  id: z.coerce.number(),
  customCode: z.string().max(255).regex(/^[a-zA-Z0-9_-]+$/),
});

export async function updateUrl(formData: FormData): Promise<ApiResponse<{ shortUrl: string }>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: 'You must be logged in to update a URL' };
    const validatedFields = updateUrlSchema.safeParse({ id: formData.get('id'), customCode: formData.get('customCode') });
    if (!validatedFields.success) return { success: false, error: 'Invalid input' };
    const { id, customCode } = validatedFields.data;
    const existingUrl = await db.query.urls.findFirst({ where: (urls, { eq, and }) => and(eq(urls.id, id), eq(urls.userId, userId)) });
    if (!existingUrl) return { success: false, error: "URL not found or you don't have permission to update it" };
    const codeExists = await db.query.urls.findFirst({ where: (urls, { eq, and, ne }) => and(eq(urls.shortCode, customCode), ne(urls.id, id)) });
    if (codeExists) return { success: false, error: 'Custom code already exists' };
    await db.update(urls).set({ shortCode: customCode, updatedAt: new Date() }).where(eq(urls.id, id));
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shortUrl = `${baseUrl}/r/${customCode}`;
    revalidatePath('/dashboard');
    return { success: true, data: { shortUrl } };
  } catch (error) {
    console.error('Failed to update URL', error);
    return { success: false, error: 'An error occurred' };
  }
}
