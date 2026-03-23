// ── Add to click_events table in src/server/db/schema.ts ─────────────────
// Add these two columns after the existing `referrer` column:
//
//   device:  varchar('device',  { length: 20  }),
//   browser: varchar('browser', { length: 50  }),
//
// The full click_events table should look like:
//
// export const clickEvents = pgTable('click_events', {
//   id:        serial('id').primaryKey(),
//   urlId:     integer('url_id').notNull().references(() => urls.id, { onDelete: 'cascade' }),
//   clickedAt: timestamp('clicked_at').notNull().defaultNow(),
//   country:   varchar('country',  { length: 2   }),
//   referrer:  varchar('referrer', { length: 255 }),
//   device:    varchar('device',   { length: 20  }),   // ← add
//   browser:   varchar('browser',  { length: 50  }),   // ← add
// });
