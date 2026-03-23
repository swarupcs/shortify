// ── Phase 3 schema additions for src/server/db/schema.ts ─────────────────

// 1. Add `deletedAt` to the urls table definition:
//
//   deletedAt: timestamp('deleted_at'),
//
// Place it after the existing `passwordHash` column.

// 2. Add this new table after `bioPages`:

export const bioPageViews = pgTable('bio_page_views', {
  id:         serial('id').primaryKey(),
  bioPageId:  integer('bio_page_id').notNull().references(() => bioPages.id, { onDelete: 'cascade' }),
  viewedAt:   timestamp('viewed_at').notNull().defaultNow(),
  country:    varchar('country', { length: 2 }),
});

// 3. Add this relation to the bioPagesRelations block (replace the existing one):
//
// export const bioPagesRelations = relations(bioPages, ({ one, many }) => ({
//   user:  one(users, { fields: [bioPages.userId], references: [users.id] }),
//   views: many(bioPageViews),   // ← add this line
// }));

// 4. Add this new relation alongside the others:

export const bioPageViewsRelations = relations(bioPageViews, ({ one }) => ({
  bioPage: one(bioPages, { fields: [bioPageViews.bioPageId], references: [bioPages.id] }),
}));
