import { relations } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
  text,
  primaryKey,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import type { AdapterAccount } from 'next-auth/adapters';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).notNull().primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'),
  role: userRoleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 })
      .$type<AdapterAccount['type']>()
      .notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', {
      length: 255,
    }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ],
);

export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 })
    .notNull()
    .primaryKey(),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_token',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [{ compositePk: primaryKey({ columns: [vt.identifier, vt.token] }) }],
);

export const urls = pgTable('urls', {
  id: serial('id').primaryKey(),
  originalUrl: varchar('original_url', { length: 2000 }).notNull(),
  shortCode: varchar('short_code', { length: 10 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  clicks: integer('clicks').default(0).notNull(),
  userId: varchar('user_id', { length: 255 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  flagged: boolean('flagged').default(false).notNull(),
  flagReason: text('flag_reason'),
  expiresAt: timestamp('expires_at'),
  passwordHash: text('password_hash'),
});

export const clickEvents = pgTable('click_events', {
  id: serial('id').primaryKey(),
  urlId: integer('url_id')
    .notNull()
    .references(() => urls.id, { onDelete: 'cascade' }),
  clickedAt: timestamp('clicked_at').notNull().defaultNow(),
  country: varchar('country', { length: 2 }),
  referrer: varchar('referrer', { length: 255 }),
});

export const counters = pgTable('counters', {
  key: varchar('key', { length: 255 }).notNull().primaryKey(),
  value: integer('value').default(0).notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ← paste here
export const rateLimits = pgTable(
  'rate_limits',
  {
    key: varchar('key', { length: 255 }).notNull(),
    windowStart: timestamp('window_start').notNull(),
    count: integer('count').notNull().default(1),
  },
  (t) => [{ pk: primaryKey({ columns: [t.key, t.windowStart] }) }],
);

export const bioPages = pgTable('bio_pages', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  handle: varchar('handle', { length: 50 }).notNull().unique(),
  profileName: varchar('profile_name', { length: 100 }).notNull().default(''),
  profileBio: varchar('profile_bio', { length: 300 }).notNull().default(''),
  theme: varchar('theme', { length: 30 }).notNull().default('violet'),
  links: jsonb('links')
    .$type<Array<{ id: string; title: string; url: string; icon: string }>>()
    .notNull()
    .default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: varchar('actor_id', { length: 255 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  action: varchar('action', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull(),
  targetId: varchar('target_id', { length: 255 }).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Phase 4: API keys ──────────────────────────────────────────────────────
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull().unique(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(), // e.g. "sk_live_AbCd" shown in UI
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
  revokedAt: timestamp('revoked_at'),
});

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Relations ──────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many, one }) => ({
  urls: many(urls),
  accounts: many(accounts),
  sessions: many(sessions),
  bioPage: one(bioPages, { fields: [users.id], references: [bioPages.userId] }),
  auditLogs: many(auditLogs),
  apiKeys: many(apiKeys),
}));

export const urlsRelations = relations(urls, ({ one, many }) => ({
  user: one(users, { fields: [urls.userId], references: [users.id] }),
  clickEvents: many(clickEvents),
}));

export const clickEventsRelations = relations(clickEvents, ({ one }) => ({
  url: one(urls, { fields: [clickEvents.urlId], references: [urls.id] }),
}));

export const bioPagesRelations = relations(bioPages, ({ one }) => ({
  user: one(users, { fields: [bioPages.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));

export const rateLimitsRelations = relations(rateLimits, () => ({}));

export const emailVerificationTokensRelations = relations(
  emailVerificationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [emailVerificationTokens.userId],
      references: [users.id],
    }),
  }),
);

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  }),
);
