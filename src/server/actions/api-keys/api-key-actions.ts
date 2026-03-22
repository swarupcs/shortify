'use server';

import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { apiKeys } from '@/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export type ApiKeyRow = {
  id: number;
  name: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

/** Generate a new API key, store its hash, return the plaintext once */
export async function createApiKey(name: string): Promise<{
  success: boolean;
  data?: { key: string; row: ApiKeyRow };
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    if (!name || name.trim().length === 0)
      return { success: false, error: 'Key name is required' };
    if (name.trim().length > 100)
      return { success: false, error: 'Name must be 100 characters or less' };

    // Check max 10 active keys per user
    const activeKeys = await db.query.apiKeys.findMany({
      where: and(
        eq(apiKeys.userId, session.user.id),
        isNull(apiKeys.revokedAt),
      ),
    });
    if (activeKeys.length >= 10)
      return { success: false, error: 'Maximum 10 active API keys allowed' };

    // Generate key: sk_live_<32 random hex chars>
    const rawSecret = crypto.randomBytes(32).toString('hex');
    const fullKey = `sk_live_${rawSecret}`;
    const keyPrefix = fullKey.substring(0, 12); // "sk_live_XXXX"

    // Hash for storage — SHA-256, never stored in plaintext
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');

    const [inserted] = await db
      .insert(apiKeys)
      .values({
        userId: session.user.id,
        name: name.trim(),
        keyHash,
        keyPrefix,
        createdAt: new Date(),
      })
      .returning();

    revalidatePath('/dashboard/settings');

    return {
      success: true,
      data: {
        key: fullKey,
        row: {
          id: inserted.id,
          name: inserted.name,
          keyPrefix: inserted.keyPrefix,
          createdAt: inserted.createdAt,
          lastUsedAt: inserted.lastUsedAt ?? null,
          revokedAt: inserted.revokedAt ?? null,
        },
      },
    };
  } catch (error) {
    console.error('Error creating API key:', error);
    return { success: false, error: 'Failed to create API key' };
  }
}

/** List all API keys for the current user */
export async function listApiKeys(): Promise<{
  success: boolean;
  data?: ApiKeyRow[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const rows = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, session.user.id),
      orderBy: (k, { desc }) => [desc(k.createdAt)],
    });

    return {
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        keyPrefix: r.keyPrefix,
        createdAt: r.createdAt,
        lastUsedAt: r.lastUsedAt ?? null,
        revokedAt: r.revokedAt ?? null,
      })),
    };
  } catch (error) {
    console.error('Error listing API keys:', error);
    return { success: false, error: 'Failed to load API keys' };
  }
}

/** Revoke an API key by ID */
export async function revokeApiKey(keyId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const key = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.id, keyId), eq(apiKeys.userId, session.user.id)),
    });

    if (!key) return { success: false, error: 'API key not found' };
    if (key.revokedAt) return { success: false, error: 'Key already revoked' };

    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(apiKeys.id, keyId));

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('Error revoking API key:', error);
    return { success: false, error: 'Failed to revoke API key' };
  }
}

/** Validate a Bearer token from an API request — returns userId or null */
export async function validateApiKey(rawKey: string): Promise<string | null> {
  try {
    if (!rawKey.startsWith('sk_live_')) return null;

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const key = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)),
    });

    if (!key) return null;

    // Update lastUsedAt non-blocking
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, key.id))
      .catch(() => {});

    return key.userId;
  } catch {
    return null;
  }
}
