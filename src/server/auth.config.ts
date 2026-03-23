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
import { headers } from 'next/headers';

declare module 'next-auth' {
  interface User {
    role?: 'user' | 'admin';
  }
  interface Session {
    user: {
      id: string;
      role?: 'user' | 'admin';
    } & DefaultSession['user'];
  }
}

declare module 'next-auth' {
  interface JWT {
    id?: string;
    role?: 'user' | 'admin';
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
      if (nextUrl.pathname.startsWith('/dashboard'))
        return isLoggedIn;
      return true;
    },

    async jwt({ token, user, account, profile }) {
      if (account?.provider === 'credentials' && user) {
        token.id      = user.id;
        token.email   = user.email;
        token.name    = user.name;
        token.picture = user.image;
        token.role    = user.role;
        return token;
      }

      if (account && profile) {
        const providerEmail = (
          (profile.email as string | undefined) ?? ''
        ).toLowerCase().trim();

        if (!providerEmail) {
          console.error('[auth] OAuth profile has no email');
          return token;
        }

        console.log(`[auth] OAuth sign-in: provider=${account.provider} email=${providerEmail} providerAccountId=${account.providerAccountId}`);

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
                console.log(`[auth] Found clean account link → user ${linkedUser.email}`);
                token.id      = linkedUser.id;
                token.email   = linkedUser.email;
                token.name    = linkedUser.name    ?? token.name;
                token.picture = linkedUser.image   ?? token.picture;
                token.role    = linkedUser.role;
                return token;
              }

              console.warn(
                `[auth] CORRUPT account link detected! ` +
                `provider_account_id=${account.providerAccountId} ` +
                `pointed to user ${linkedUser.email} ` +
                `but Google says the signed-in email is ${providerEmail}. ` +
                `Deleting bad link and recreating.`
              );
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
            console.log(`[auth] Creating new user for ${providerEmail}`);
            const [created] = await db
              .insert(users)
              .values({
                id:        nanoid(),
                email:     providerEmail,
                name:      (profile.name as string | undefined) ?? null,
                image:     (profile.picture as string | undefined) ??
                           (profile.avatar_url as string | undefined) ?? null,
                role:      'user',
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();
            dbUser = created;
          }

          console.log(`[auth] Linking provider ${account.provider} → user ${dbUser.email}`);
          await db
            .insert(accounts)
            .values({
              userId:            dbUser.id,
              type:              'oauth',
              provider:          account.provider,
              providerAccountId: account.providerAccountId,
              access_token:      account.access_token  ?? null,
              refresh_token:     account.refresh_token ?? null,
              expires_at:        account.expires_at    ?? null,
              token_type:        account.token_type    ?? null,
              scope:             account.scope         ?? null,
              id_token:          account.id_token      ?? null,
            })
            .onConflictDoNothing();

          token.id      = dbUser.id;
          token.email   = dbUser.email;
          token.name    = dbUser.name    ?? token.name;
          token.picture = dbUser.image   ?? token.picture;
          token.role    = dbUser.role;

          console.log(`[auth] Token set for user ${dbUser.email} (id: ${dbUser.id})`);
        } catch (err) {
          console.error('[auth] OAuth jwt callback error:', err);
        }

        return token;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id    = token.id    as string;
      session.user.role  = token.role  as 'user' | 'admin' | undefined;
      session.user.email = token.email as string;
      session.user.name  = token.name  as string;
      session.user.image = token.picture as string | null | undefined;
      return session;
    },
  },

  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId:     process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // ── Rate limit login attempts by IP ──────────────────────────────
        // 10 attempts/hour per IP before lockout
        const ip = (
          request?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          request?.headers?.get('x-real-ip') ??
          'unknown'
        );

        const limitResult = await rateLimit(`login:ip:${ip}`, 10);
        if (!limitResult.allowed) {
          // Returning null shows a generic "Sign in failed" error to the user.
          // NextAuth doesn't support custom error messages from authorize(),
          // so we log the real reason server-side.
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
          id:    user.id,
          email: user.email,
          name:  user.name,
          image: user.image,
          role:  user.role,
        };
      },
    }),
  ],
};
