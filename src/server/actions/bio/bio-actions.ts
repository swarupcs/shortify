'use server';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { bioPages } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { writeAuditLog } from '@/server/actions/admin/audit-log';

export type BioLink = {
  id:    string;
  title: string;
  url:   string;
  icon:  string;
};

export type BioPageData = {
  id:          number;
  handle:      string;
  profileName: string;
  profileBio:  string;
  theme:       string;
  links:       BioLink[];
  userId:      string;
};

const saveBioSchema = z.object({
  handle: z
    .string().min(3).max(30)
    .regex(/^[a-z0-9_-]+$/, 'Handle can only contain lowercase letters, numbers, hyphens and underscores'),
  profileName: z.string().max(100).default(''),
  profileBio:  z.string().max(300).default(''),
  theme:       z.string().max(30).default('violet'),
  links: z
    .array(z.object({
      id:    z.string(),
      title: z.string().max(100),
      url:   z.string().url('Each link must be a valid URL'),
      icon:  z.string().max(30),
    }))
    .max(20),
});

export async function saveBioPage(input: {
  handle:      string;
  profileName: string;
  profileBio:  string;
  theme:       string;
  links:       BioLink[];
}): Promise<{ success: boolean; data?: BioPageData; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const validated = saveBioSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || 'Invalid input' };
    }

    const { handle, profileName, profileBio, theme, links } = validated.data;

    const existing = await db.query.bioPages.findFirst({
      where: eq(bioPages.handle, handle),
    });
    if (existing && existing.userId !== session.user.id) {
      return { success: false, error: 'That handle is already taken. Try another.' };
    }

    const [saved] = await db
      .insert(bioPages)
      .values({
        userId:      session.user.id,
        handle,
        profileName,
        profileBio,
        theme,
        links,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      })
      .onConflictDoUpdate({
        target: bioPages.userId,
        set:    { handle, profileName, profileBio, theme, links, updatedAt: new Date() },
      })
      .returning();

    // Audit log
    writeAuditLog({
      actorId:    session.user.id,
      action:     'USER_BIO_SAVED',
      targetType: 'bio',
      targetId:   String(saved.id),
      metadata:   { handle, linkCount: links.length, theme },
    });

    revalidatePath(`/bio/${handle}`);
    return { success: true, data: saved as BioPageData };
  } catch (error) {
    console.error('Error saving bio page:', error);
    return { success: false, error: 'Failed to save bio page' };
  }
}

export async function getUserBioPage(): Promise<{
  success: boolean;
  data?: BioPageData;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
    const page = await db.query.bioPages.findFirst({ where: eq(bioPages.userId, session.user.id) });
    if (!page) return { success: true, data: undefined };
    return { success: true, data: page as BioPageData };
  } catch (error) {
    console.error('Error loading bio page:', error);
    return { success: false, error: 'Failed to load bio page' };
  }
}

export async function getBioPageByHandle(handle: string): Promise<{
  success: boolean;
  data?: BioPageData;
  error?: string;
}> {
  try {
    const page = await db.query.bioPages.findFirst({ where: eq(bioPages.handle, handle) });
    if (!page) return { success: false, error: 'Bio page not found' };
    return { success: true, data: page as BioPageData };
  } catch (error) {
    console.error('Error loading bio page by handle:', error);
    return { success: false, error: 'Failed to load bio page' };
  }
}

export async function checkHandleAvailability(handle: string): Promise<{ available: boolean }> {
  try {
    const session  = await auth();
    const existing = await db.query.bioPages.findFirst({ where: eq(bioPages.handle, handle) });
    const available = !existing || existing.userId === session?.user?.id;
    return { available };
  } catch {
    return { available: false };
  }
}
