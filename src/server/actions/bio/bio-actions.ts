'use server';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { bioPages } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export type BioLink = {
  id: string;
  title: string;
  url: string;
  icon: string;
};

export type BioPageData = {
  id: number;
  handle: string;
  profileName: string;
  profileBio: string;
  theme: string;
  links: BioLink[];
  userId: string;
};

const saveBioSchema = z.object({
  handle: z
    .string()
    .min(3, 'Handle must be at least 3 characters')
    .max(30, 'Handle must be 30 characters or less')
    .regex(
      /^[a-z0-9_-]+$/,
      'Handle can only contain lowercase letters, numbers, hyphens and underscores',
    ),
  profileName: z.string().max(100).default(''),
  profileBio: z.string().max(300).default(''),
  theme: z.string().max(30).default('violet'),
  links: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().max(100),
        url: z.string().url('Each link must be a valid URL'),
        icon: z.string().max(30),
      }),
    )
    .max(20, 'Maximum 20 links allowed'),
});

/** Save or update the current user's bio page */
export async function saveBioPage(input: {
  handle: string;
  profileName: string;
  profileBio: string;
  theme: string;
  links: BioLink[];
}): Promise<{ success: boolean; data?: BioPageData; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const validated = saveBioSchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.errors[0]?.message || 'Invalid input';
      return { success: false, error: firstError };
    }

    const { handle, profileName, profileBio, theme, links } = validated.data;

    // Check handle isn't taken by another user
    const existing = await db.query.bioPages.findFirst({
      where: eq(bioPages.handle, handle),
    });

    if (existing && existing.userId !== session.user.id) {
      return { success: false, error: 'That handle is already taken. Try another.' };
    }

    // Upsert — one bio page per user
    const [saved] = await db
      .insert(bioPages)
      .values({
        userId: session.user.id,
        handle,
        profileName,
        profileBio,
        theme,
        links,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: bioPages.userId,
        set: {
          handle,
          profileName,
          profileBio,
          theme,
          links,
          updatedAt: new Date(),
        },
      })
      .returning();

    revalidatePath(`/bio/${handle}`);

    return { success: true, data: saved as BioPageData };
  } catch (error) {
    console.error('Error saving bio page:', error);
    return { success: false, error: 'Failed to save bio page' };
  }
}

/** Load the current user's bio page (for the editor) */
export async function getUserBioPage(): Promise<{
  success: boolean;
  data?: BioPageData;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const page = await db.query.bioPages.findFirst({
      where: eq(bioPages.userId, session.user.id),
    });

    if (!page) return { success: true, data: undefined };
    return { success: true, data: page as BioPageData };
  } catch (error) {
    console.error('Error loading bio page:', error);
    return { success: false, error: 'Failed to load bio page' };
  }
}

/** Load a bio page by handle (for the public page) */
export async function getBioPageByHandle(handle: string): Promise<{
  success: boolean;
  data?: BioPageData;
  error?: string;
}> {
  try {
    const page = await db.query.bioPages.findFirst({
      where: eq(bioPages.handle, handle),
    });

    if (!page) return { success: false, error: 'Bio page not found' };
    return { success: true, data: page as BioPageData };
  } catch (error) {
    console.error('Error loading bio page by handle:', error);
    return { success: false, error: 'Failed to load bio page' };
  }
}

/** Check if a handle is available (for live validation) */
export async function checkHandleAvailability(handle: string): Promise<{
  available: boolean;
}> {
  try {
    const session = await auth();
    const existing = await db.query.bioPages.findFirst({
      where: eq(bioPages.handle, handle),
    });
    // Available if no row, or the row belongs to the current user
    const available = !existing || existing.userId === session?.user?.id;
    return { available };
  } catch {
    return { available: false };
  }
}
