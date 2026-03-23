// ── Add these two tables to src/server/db/schema.ts ──────────────────────
// Place them after the `apiKeys` table definition.
// Also add the relations at the bottom alongside the other relations.

import { pgTable, varchar, timestamp, serial, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Email verification tokens ──────────────────────────────────────────────
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id:        serial('id').primaryKey(),
  userId:    varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt:    timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Password reset tokens ──────────────────────────────────────────────────
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id:        serial('id').primaryKey(),
  userId:    varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt:    timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Add these to the relations section at the bottom of schema.ts ──────────
export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, { fields: [emailVerificationTokens.userId], references: [users.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));
