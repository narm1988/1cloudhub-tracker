# 1CloudHub Tracker — Style Guide

Typography, spacing, and button tokens as actually implemented in the app. This supersedes the earlier draft of this file, which proposed swapping in a different (rem-based) type scale from an external reference doc — that was never implemented. What shipped instead: the app's own existing type scale, kept at its current pixel values, with **inconsistent usage fixed** so every page draws from the same tokens. Lower risk, same visual language the app already had, just applied uniformly.

## 0. In progress — Enterprise Density pass

**Status: partially rolled out.** The scale in §2 below was judged too large/loose for an enterprise tool (reference: a denser internal CRM screenshot). A tighter scale has been applied to:
- `TopBar.tsx` — global, so every page already has this
- `ProjectsPage.tsx` — page title, create button, and the project list (rebuilt as a table, not cards)

**Not yet applied** to `Button.tsx`, `Card.tsx`, `Sidebar.tsx` (deliberately excluded — its aurora/particle animation is being kept), or any other page (Epics, People, Search, Story/Issue detail, Settings, Project detail). Those still use the §2 scale below until this pass is reviewed and rolled out further.

**The new numbers, superseding §2/§4 wherever applied:**

| Element | Old | New |
|---|---|---|
| Page title | 22px | **17px**, `tracking-[-0.01em]` |
| Topbar height | 60px | **48px** |
| Topbar padding | 24px | **16px** horizontal |
| Topbar icons (bell, sidebar toggle) | 18px | **16px**, `rounded-lg` → `rounded-md` |
| Topbar search | 32px tall, 288px wide, 13px text | **28px tall, 256px wide, 12px text** |
| Topbar avatar | `md` (28px) | **`sm`** (20px) — this one instance only, `Avatar.tsx` itself unchanged |
| Primary action button | 40px tall, `rounded-lg` (8px), 14px text | **30px tall, `rounded-md` (6px), 12px text** |
| Notification drawer width | 360px | **320px** |
| Notification drawer title | 15px | **13px** |
| Notification row text | 13px message / 12px meta | **12px message / 11px meta** |
| List views (Projects) | Bordered card grid | **Real `<table>`**: 10px uppercase tracked headers, 13px name, 12px meta, tabular-nums dates |

The pattern for anything not yet migrated: shrink text 1 step, shrink control height ~25%, drop `rounded-lg`→`rounded-md`, and prefer a table over a card grid for anything that's actually a list of records.

## 1. Font Stack

```js
// tailwind.config.js
fontFamily: {
  display: ["'Inter'", 'sans-serif'],
  body: ["'Inter'", 'sans-serif'],
  mono: ["'JetBrains Mono'", 'monospace'],
}
```

Space Grotesk (previously the heading face) and IBM Plex Mono (previously mono) have been dropped. `font-display` and `font-body` both resolve to Inter now — the classes are kept as-is in components so existing markup didn't need touching, but there is no longer a separate display typeface. `font-mono` is JetBrains Mono, used for display IDs (`1CH-111`), story points, and dates.

## 2. Type Scale (current baseline outside the density pass)

Defined in `tailwind.config.js` under `theme.extend.fontSize`.

| Token | Size | Role |
|---|---|---|
| `text-micro` | 10px | Avatar initials (sm/md), tracking-heavy sidebar sub-labels |
| `text-caption` | 11px | Metadata, timestamps, table-cell secondary text |
| `text-label` | 12px | Field labels, dropdown menu items, badges, avatar initials (lg) |
| `text-body` | 13px | Default body copy, descriptions, empty states |
| `text-body-lg` | 14px | Form inputs, buttons (md/lg), error messages, list-row primary text |
| `text-subhead` | 15px | Card titles in grid views (project/epic cards), empty-state headings |
| `text-heading` | 22px | Page-title / section-title / dialog-title token (superseded by §0's 17px on migrated pages) |
| `text-display` | 32px | Marketing-style hero text (Login page tagline only) |

Note: several files now write literal arbitrary values (`text-[13px]`, `text-[12px]`, etc.) rather than these token classes — that's the current state of the codebase, not a regression to fix. Match whichever convention the file you're editing already uses.

`SECTION_HEADER` in [DetailFields.tsx](src/components/detail/DetailFields.tsx) is the shared class for in-card section headers ("Description", "Details", "Comments", etc.) — reuse it rather than inventing a new header style.

Logo lockups ("1CloudHub" wordmark on the Login/Accept-invite screens) are exempt from all of the above — they're a brand mark, not content typography.

## 3. Spacing & Radius

App-wide spacing uses Tailwind's default 4px-based scale (`p-3.5`/`p-5`/`p-6`, `gap-3`/`gap-4`/`gap-5`, etc.) — confirmed consistent by audit, no dedicated tokens needed.

Border-radius, outside the density pass:

| Role | Class | Value |
|---|---|---|
| Cards, Modal | `rounded-xl` | 12px |
| Buttons, Inputs | `rounded-lg` | 8px |
| Badges, dropdown menu items | `rounded-md` | 6px |
| Avatars | `rounded-full` | — |

Inside the density pass (§0), buttons/icon-buttons/badges move to `rounded-md` (6px) uniformly.

## 4. Buttons

[Button.tsx](src/components/ui/Button.tsx) is still the default for CTAs elsewhere in the app — variant (`primary`/`secondary`/`ghost`) × size (`sm`/`md`/`lg`):

| Size | Text | Padding |
|---|---|---|
| `sm` | `text-label` (12px) | `px-3 py-1.5` |
| `md` | `text-body-lg` (14px) | `px-4 py-2.5` |
| `lg` | `text-body-lg` (14px) | `px-5 py-3` |

`ProjectsPage.tsx`'s "New project" button is the one exception — it's a page-local `<button>`, not `Button.tsx`, using the §0 density numbers (30px/6px/12px). That was deliberate: overriding a shared component's classes from a single call site via `className` is fragile (Tailwind gives no reliable cascade-order guarantee), so a local element was safer than patching `Button.tsx` for one page. If/when the density pass rolls out everywhere, `Button.tsx` itself should get a size variant matching these numbers instead of every page reinventing a local button.

Two categories are intentionally **not** routed through `Button`, regardless of density pass:
- Navigational elements — "Back" links, icon-only close/remove buttons
- Inline editors — the Status/Priority/Assignee/Type dropdown triggers in `DetailFields.tsx`, tab strips (underline tabs in `ProjectDetailPage.tsx`), the theme-swatch picker in `SettingsPage.tsx`
