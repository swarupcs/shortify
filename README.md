# Shortify — Complete UI/UX Redesign Guide

## Overview of Changes

This redesign transforms the app into a modern, polished product with a **violet/fuchsia gradient accent** color system, improved typography, rounded-2xl card shapes, and several new features.

---

## New Color System (globals.css)

The primary color is now **violet** (`oklch(0.55 0.22 293)`) instead of the previous neutral black. This creates a cohesive brand identity.

**Replace:** `src/app/globals.css` → `globals.css`

---

## File Replacements

### 1. Homepage (`src/app/page.tsx`)

**Replace with:** `page.tsx`

New sections:

- Gradient hero with "AI-Powered URL Safety" badge
- Animated gradient background with dot grid pattern
- Stats bar (1M+ links, 50M+ clicks, 99.9% uptime)
- 4-column feature grid
- Full-bleed CTA with dot pattern overlay

### 2. Header (`src/components/layout/header.tsx`)

**Replace with:** `header.tsx`

Improvements:

- Sticky with backdrop blur
- Logo with violet gradient icon
- Active link highlighting via `usePathname`
- User dropdown menu with avatar (instead of just a logout button)
- Mobile sheet with all nav items
- "Sign up" CTA button in violet
- Admin panel link for admin users

### 3. URL Shortener Form (`src/components/urls/url-shortener-form.tsx`)

**Replace with:** `url-shortener-form.tsx`

Improvements:

- Inline input row with icon, text input, and gradient button in one pill
- Advanced options collapsible (custom code)
- Animated check/copy state on copy button
- Cleaner result card with violet accent colors
- Better flagged URL warning design
- Removed dependency on window.location for BASEURL

### 4. Dashboard Page (`src/app/(user)/dashboard/page.tsx`)

**Replace with:** `dashboard-page.tsx`

New features:

- Stats cards (Total Links, Total Clicks, Avg Clicks, Top Link)
- Personalized greeting with user's first name
- Analytics quick link
- Cleaner card layout with rounded-2xl

### 5. User URLs Table (`src/components/urls/user-urls-table.tsx`)

**Replace with:** `user-urls-table.tsx`

Improvements:

- Animated copy button (check mark on success)
- Better empty state with icon
- Mobile card view (replaces cramped table on small screens)
- Hover-reveal external link button
- Monospace short code display in violet

### 6. Login Page (`src/app/(auth)/login/page.tsx`)

**Replace with:** `login-page.tsx`

New design:

- Split-screen layout (branding panel + form)
- Gradient left panel with dot pattern
- Feature list in the branding panel
- Mobile-responsive (collapses to single column)

---

## New Feature Pages

### 7. Bulk URL Shortener (`src/app/(user)/dashboard/bulk/page.tsx`)

**Copy:** `bulk-shorten-page.tsx`

**Route:** `/dashboard/bulk`

Features:

- Process up to 20 URLs at once
- Progress bar during processing
- Color-coded results (green = success, amber = flagged, red = error)
- Copy all results
- Download as CSV
- Per-row copy buttons

**Add to dashboard nav link:**

```tsx
<Link href='/dashboard/bulk'>Bulk Shortener</Link>
```

### 8. Link in Bio Builder (`src/app/(user)/dashboard/bio/page.tsx`)

**Copy:** `link-in-bio-page.tsx`

**Route:** `/dashboard/bio`

Features:

- Drag-sortable link list (visual only, wire up react-beautiful-dnd or dnd-kit for full implementation)
- 5 theme presets (Violet, Ocean, Forest, Sunset, Midnight)
- Live preview panel
- Profile name + bio editor
- Icon selector per link
- "Share Page" button (needs backend implementation for actual bio pages)

---

## Quick Nav Updates

Add these links to the dashboard sidebar or header:

```tsx
{ href: "/dashboard/bulk", label: "Bulk Shorten", icon: Upload }
{ href: "/dashboard/bio", label: "Link in Bio", icon: User }
```

---

## New Feature Ideas (Not Implemented — Ready to Build)

1. **Link Expiry** — Add `expiresAt: timestamp | null` to the `urls` schema. Check during redirect and show expired page.

2. **Password-Protected Links** — Add `password: text | null` to schema. Show password form before redirect.

3. **UTM Parameter Builder** — UI to auto-append UTM params before shortening.

4. **Click Heatmap by Hour** — Track click timestamps, show hourly distribution chart.

5. **Custom Domain Support** — Let users map their own domain to short links.

6. **Webhook on Click** — Notify a URL when a link is clicked (great for automation).

7. **Browser Extension** — One-click shorten from any page.

---

## Dependencies to Install

```bash
# Already in project — no new dependencies needed for core redesign

# For full drag-and-drop in Link in Bio:
npm install @dnd-kit/core @dnd-kit/sortable

# For animations (optional but recommended):
npm install framer-motion
```

---

## Color Reference

| Purpose  | Light                          | Dark                           |
| -------- | ------------------------------ | ------------------------------ |
| Primary  | violet-600                     | violet-400                     |
| Gradient | from-violet-600 to-fuchsia-600 | from-violet-700 to-fuchsia-700 |
| Success  | emerald-500/600                | emerald-400                    |
| Warning  | amber-500/600                  | amber-400                      |
| Danger   | red-500/600                    | red-400                        |
| Info     | blue-500/600                   | blue-400                       |
