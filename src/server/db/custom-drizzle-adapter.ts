import { DrizzleAdapter } from '@auth/drizzle-adapter';
import type { Adapter, AdapterSession, AdapterUser } from 'next-auth/adapters';
import { db } from './index';
import { users, accounts, sessions, verificationTokens } from './schema';
import { eq, and } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;
export type VerificationToken = InferSelectModel<typeof verificationTokens>;

export function CustomDrizzleAdapter(): Adapter {
  const base = DrizzleAdapter(db);

  return {
    ...base,

    // ------------------------------------------------------------------
    // getUserByEmail
    // Always lower-case so OAuth emails (which Google sends lower-cased)
    // match credentials-registered emails.
    // ------------------------------------------------------------------
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));
      return user ?? null;
    },

    // ------------------------------------------------------------------
    // getUserByAccount  ← THE KEY FIX
    //
    // NextAuth calls this first on every OAuth sign-in.
    // If it returns a user, NextAuth uses that user and SKIPS createUser.
    // If it returns null, NextAuth calls createUser → linkAccount.
    //
    // The original join-based implementation was fragile. We now do two
    // simple queries:
    //   1. Find the accounts row (provider + providerAccountId).
    //   2. Use its userId to fetch the users row directly.
    //
    // This guarantees we always return the SAME user that was originally
    // linked to this Google account, regardless of how many times they
    // sign in.
    // ------------------------------------------------------------------
    async getUserByAccount({
      provider,
      providerAccountId,
    }: {
      provider: string;
      providerAccountId: string;
    }): Promise<AdapterUser | null> {
      // Step 1 — find the linked account row
      const [account] = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.provider, provider),
            eq(accounts.providerAccountId, providerAccountId),
          ),
        )
        .limit(1);

      if (!account) {
        // No account row → brand-new OAuth user, NextAuth will call createUser
        return null;
      }

      // Step 2 — load the user that owns this account
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, account.userId))
        .limit(1);

      return user ?? null;
    },

    // ------------------------------------------------------------------
    // getUser — plain PK lookup
    // ------------------------------------------------------------------
    async getUser(id: string): Promise<AdapterUser | null> {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return user ?? null;
    },

    // ------------------------------------------------------------------
    // createUser — called ONLY for brand-new OAuth users (first sign-in).
    // We generate our own nanoid so the PK is always our format, never
    // the OAuth provider's sub string.
    // ------------------------------------------------------------------
    async createUser(data: NewUser): Promise<AdapterUser> {
      const newUser: NewUser = {
        ...data,
        id: nanoid(), // always our own ID
        email: data.email.toLowerCase(),
        role: data.role ?? 'user',
        createdAt: data.createdAt ?? new Date(),
        updatedAt: data.updatedAt ?? new Date(),
      };

      const [created] = await db.insert(users).values(newUser).returning();

      return created;
    },

    // ------------------------------------------------------------------
    // updateUser
    // ------------------------------------------------------------------
    async updateUser(data: Partial<User>): Promise<AdapterUser> {
      const [updated] = await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, data.id!))
        .returning();
      return updated;
    },

    // ------------------------------------------------------------------
    // linkAccount — called after createUser to store the OAuth account row
    // ------------------------------------------------------------------
    async linkAccount(account: NewAccount): Promise<void> {
      await db.insert(accounts).values(account);
    },

    // ------------------------------------------------------------------
    // Session methods (unchanged from base, but explicit for clarity)
    // ------------------------------------------------------------------
    async createSession(session: NewSession): Promise<AdapterSession> {
      const [created] = await db.insert(sessions).values(session).returning();
      return created;
    },

    async getSessionAndUser(
      sessionToken: string,
    ): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const result = await db
        .select()
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.sessionToken, sessionToken))
        .limit(1);

      const record = result[0];
      if (!record) return null;
      return { session: record.sessions, user: record.users };
    },

    async deleteSession(sessionToken: string): Promise<void> {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    },

    async useVerificationToken(params: {
      identifier: string;
      token: string;
    }): Promise<VerificationToken | null> {
      const [deleted] = await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, params.identifier),
            eq(verificationTokens.token, params.token),
          ),
        )
        .returning();
      return deleted ?? null;
    },
  };
}
