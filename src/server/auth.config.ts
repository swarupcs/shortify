import { DefaultSession, NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { users, accounts } from './db/schema';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { nanoid } from 'nanoid';
import { rateLimit } from '@/lib/rate-limit';

declare module 'next-auth' {
  interface User {
    role?: 'user' | 'admin';
  }
  interface Session {
    user: {
      id: string;
      role?: 'user' | 'admin';
      emailVerified?: Date | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth' {
  interface JWT {
    id?: string;
    role?: 'user' | 'admin';
    emailVerified?: Date | null;
  }
}

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
    newUser: '/register',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (nextUrl.pathname.startsWith('/admin'))
        return isLoggedIn && auth?.user?.role === 'admin';
      if (nextUrl.pathname.startsWith('/dashboard')) return isLoggedIn;
      return true;
    },

    async jwt({ token, user, account, profile }) {
      // ── Credentials sign-in ──────────────────────────────────────────
      if (account?.provider === 'credentials' && user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = user.role;
        // Load emailVerified from DB so the token is accurate immediately
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id as string),
          columns: { emailVerified: true },
        });
        token.emailVerified = dbUser?.emailVerified ?? null;
        return token;
      }

      // ── OAuth sign-in ────────────────────────────────────────────────
      if (account && profile) {
        const providerEmail = ((profile.email as string | undefined) ?? '')
          .toLowerCase()
          .trim();

        if (!providerEmail) {
          console.error('[auth] OAuth profile has no email');
          return token;
        }

        try {
          const [existingAccount] = await db
            .select({ userId: accounts.userId })
            .from(accounts)
            .where(
              and(
                eq(accounts.provider, account.provider),
                eq(accounts.providerAccountId, account.providerAccountId),
              ),
            )
            .limit(1);

          if (existingAccount) {
            const [linkedUser] = await db
              .select()
              .from(users)
              .where(eq(users.id, existingAccount.userId))
              .limit(1);

            if (linkedUser) {
              if (linkedUser.email.toLowerCase() === providerEmail) {
                // ── Ensure OAuth users are always marked verified ───────
                if (!linkedUser.emailVerified) {
                  await db
                    .update(users)
                    .set({ emailVerified: new Date(), updatedAt: new Date() })
                    .where(eq(users.id, linkedUser.id));
                }
                token.id = linkedUser.id;
                token.email = linkedUser.email;
                token.name = linkedUser.name ?? token.name;
                token.picture = linkedUser.image ?? token.picture;
                token.role = linkedUser.role;
                token.emailVerified = linkedUser.emailVerified ?? new Date();
                return token;
              }
              // Corrupt link — delete and recreate below
              await db
                .delete(accounts)
                .where(
                  and(
                    eq(accounts.provider, account.provider),
                    eq(accounts.providerAccountId, account.providerAccountId),
                  ),
                );
            }
          }

          let [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, providerEmail))
            .limit(1);

          if (!dbUser) {
            const [created] = await db
              .insert(users)
              .values({
                id: nanoid(),
                email: providerEmail,
                name: (profile.name as string | undefined) ?? null,
                image:
                  (profile.picture as string | undefined) ??
                  (profile.avatar_url as string | undefined) ??
                  null,
                role: 'user',
                // OAuth users are pre-verified by the provider
                emailVerified: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();
            dbUser = created;
          } else if (!dbUser.emailVerified) {
            // Existing user signing in via OAuth for first time — mark verified
            await db
              .update(users)
              .set({ emailVerified: new Date(), updatedAt: new Date() })
              .where(eq(users.id, dbUser.id));
            dbUser = { ...dbUser, emailVerified: new Date() };
          }

          await db
            .insert(accounts)
            .values({
              userId: dbUser.id,
              type: 'oauth',
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
            })
            .onConflictDoNothing();

          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name ?? token.name;
          token.picture = dbUser.image ?? token.picture;
          token.role = dbUser.role;
          token.emailVerified = dbUser.emailVerified ?? new Date();
        } catch (err) {
          console.error('[auth] OAuth jwt callback error:', err);
        }
        return token;
      }

      // ── Subsequent requests ──────────────────────────────────────────
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as 'user' | 'admin' | undefined;
      session.user.email = token.email as string;
      session.user.name = token.name as string;
      session.user.image = token.picture as string | null | undefined;
      session.user.emailVerified =
        (token.emailVerified as Date | null | undefined) ?? null;
      return session;
    },
  },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Rate limit: 10 login attempts/hour per IP
        const ip =
          request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          request?.headers?.get('x-real-ip') ??
          'unknown';

        const limitResult = await rateLimit(`login:ip:${ip}`, 10);
        if (!limitResult.allowed) {
          console.warn(`[auth] Login rate limit exceeded for IP ${ip}`);
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user) return null;
        const ok = await bcrypt.compare(password, user.password || '');
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
};
