# Phase 2 — User Features

## What's included

### New files
| File | Purpose |
|------|---------|
| `server/db/schema.ts` | Updated schema — adds `expiresAt`, `passwordHash` to `urls`; new `click_events` and `counters` tables |
| `server/actions/urls/get-url.ts` | Updated — expiry check, password check, click event recording (non-blocking) |
| `server/actions/urls/verify-url-password.ts` | New — bcrypt.compare server action, sets httpOnly cookie on success |
| `server/actions/urls/get-click-analytics.ts` | New — country breakdown, time series, referrer queries |
| `server/actions/urls/shorten-url.ts` | Updated — accepts `expiresAt` and `password` fields, hashes password |
| `app/(user)/r/[shortCode]/page.tsx` | Updated — expired URL UI, password prompt UI, flagged UI (unchanged) |
| `app/(auth)/login/page.tsx` | Fixed — removed stray `Shortify;` bare statement that would crash in production |
| `app/api/cron/expire-urls/route.ts` | New — nightly cleanup cron for expired URLs |
| `components/urls/url-shortener-form.tsx` | Updated — expiry date picker + password field under advanced options |
| `components/dashboard/analytics-tab.tsx` | Updated — Timeline tab (30-day line chart) + Countries tab (country bars + referrer list) |
| `components/modals/password-form.tsx` | New — client component password form on redirect page |

## Migration (required before running)

Run this after copying `schema.ts`:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

This adds:
- `urls.expires_at` — nullable timestamp
- `urls.password_hash` — nullable text
- `click_events` table — per-redirect tracking
- `counters` table — generic key/value counters

All new columns are nullable or have defaults — zero breaking changes to existing rows.

## How to integrate

Copy files into your project maintaining the same paths. The `src/` prefix maps to your `src/` directory.

### Files to replace (existing files)
```
src/server/db/schema.ts                          ← replace
src/server/actions/urls/get-url.ts               ← replace
src/server/actions/urls/shorten-url.ts           ← replace
src/app/(user)/r/[shortCode]/page.tsx            ← replace
src/app/(auth)/login/page.tsx                    ← replace (fixes crash bug)
src/components/urls/url-shortener-form.tsx       ← replace
src/components/dashboard/analytics-tab.tsx       ← replace
```

### New files to add
```
src/server/actions/urls/verify-url-password.ts   ← new
src/server/actions/urls/get-click-analytics.ts   ← new
src/app/api/cron/expire-urls/route.ts            ← new
src/components/modals/password-form.tsx          ← new
```

## Optional: Vercel Cron setup

To enable nightly cleanup of expired URLs, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-urls",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Set env var `CRON_SECRET` to a random string. The cron deletes URLs that expired more than 7 days ago (grace period for recovery).

Without the cron, expired URLs still work correctly — the expiry check happens at redirect time and shows an "Expired" page. The cron just keeps the database clean.

## New features at a glance

### URL expiry
- Advanced options → date picker → sets `expiresAt`
- Redirect page detects expiry → shows "Link Expired" page with expiry date
- Existing URLs without `expiresAt` are unaffected

### Password protection
- Advanced options → password field → bcrypt-hashed on save
- Redirect page shows password prompt when `passwordHash` is set
- 1-hour httpOnly cookie set on correct password so user isn't re-prompted
- Server action `verifyUrlPassword` handles bcrypt compare

### Click analytics
- Every redirect writes a `click_events` row (non-blocking, won't slow redirects)
- Records country (from `x-vercel-ip-country` or `cf-ipcountry` header) and referrer domain
- Analytics tab now has 4 tabs: Bar Chart, Pie Chart, Timeline (30-day line), Countries (top 10 + referrers)
- Country flags rendered from country codes using Unicode code points

### Bug fix
- `login/page.tsx` had a stray `Shortify;` bare statement that TypeScript may allow but causes runtime issues — removed



# Phase 1 — Fix broken/incomplete things

## Files changed

| Output file | Destination |
|---|---|
| `src/server/actions/urls/check-url-safety.ts` | Replace existing |
| `src/server/actions/urls/get-url.ts` | Replace existing |
| `src/server/actions/urls/get-user-urls.ts` | Replace existing |
| `src/app/(user)/r/[shortCode]/page.tsx` | Replace existing |
| `src/app/api/cron/expire-urls/route.ts` | Replace existing |

## No schema changes required
All three fixes use existing tables (counters, urls, click_events).

## What changed

### 1. aiScansToday counter (check-url-safety.ts)
- After every successful Gemini API call, atomically increments
  the `ai_scans_today` row in the `counters` table via
  INSERT ... ON CONFLICT DO UPDATE
- Fire-and-forget — counter failure never blocks URL shortening
- Health monitor at /admin/health now shows real numbers

### 2. Cron counter reset (expire-urls/route.ts)
- Daily cron now resets `ai_scans_today` to 0 at midnight
- Upserts the row so it works even on first ever run

### 3. Click recording on password re-entry (get-url.ts + page.tsx)
- Previously: when a user already had the access cookie, the redirect
  page called redirect() directly, skipping click increment and
  click_events insert entirely
- Fix: extracted recordClick() helper shared by both paths
- getUrlByShortCode now records the click when cookie is valid and
  returns passwordProtected: false, letting the page do a normal redirect
- Removed the inline redirect() + cookies() check from the page —
  the server action handles it cleanly

### 4. getUserUrls SQL ordering (get-user-urls.ts)
- Replaced db.query.urls.findMany with relational API with explicit
  db.select().from(urls).where(eq(...)).orderBy(desc(urls.createdAt))
- Ordering now happens in Postgres, not in JS after the fact
- Only selects the 8 columns the UI actually needs
