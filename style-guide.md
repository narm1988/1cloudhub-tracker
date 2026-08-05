# 1CloudHub Tracker — Style Guide

Typography, spacing, and button tokens as actually implemented in the app. This supersedes the earlier draft of this file, which proposed swapping in a different (rem-based) type scale from an external reference doc — that was never implemented. What shipped instead: the app's own existing type scale, kept at its current pixel values, with **inconsistent usage fixed** so every page draws from the same tokens. Lower risk, same visual language the app already had, just applied uniformly.

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

## 2. Type Scale

Defined in `tailwind.config.js` under `theme.extend.fontSize`. **These are the only text sizes to use** — no raw Tailwind `text-xs/sm/base/lg/xl/2xl/3xl` in page or component code.

| Token | Size | Role |
|---|---|---|
| `text-micro` | 10px | Avatar initials (sm/md), tracking-heavy sidebar sub-labels |
| `text-caption` | 11px | Metadata, timestamps, table-cell secondary text |
| `text-label` | 12px | Field labels, dropdown menu items, badges, avatar initials (lg) |
| `text-body` | 13px | Default body copy, descriptions, empty states |
| `text-body-lg` | 14px | Form inputs, buttons (md/lg), error messages, list-row primary text |
| `text-subhead` | 15px | Card titles in grid views (project/epic cards), empty-state headings |
| `text-heading` | 22px | **The single page-title / section-title / dialog-title token** — every `<h1>` page title, `Modal` title, and the notification-drawer title use this |
| `text-display` | 32px | Marketing-style hero text (Login page tagline only) |

`SECTION_HEADER` in [DetailFields.tsx](src/components/detail/DetailFields.tsx) (`font-display text-body-lg font-semibold text-ink`) is the shared class for in-card section headers ("Description", "Details", "Comments", etc.) — reuse it rather than inventing a new header style.

Logo lockups ("1CloudHub" wordmark on the Login/Accept-invite screens) are exempt — they're a brand mark, not content typography, and keep their own sizing.

## 3. Spacing & Radius

No new spacing tokens were introduced — the app already used Tailwind's default 4px-based scale (`p-3.5`/`p-5`/`p-6`, `gap-3`/`gap-4`/`gap-5`, etc.) consistently; that was confirmed by audit, not changed.

Border-radius follows a role-based convention (also unchanged, already consistent):

| Role | Class | Value |
|---|---|---|
| Cards, Modal | `rounded-xl` | 12px |
| Buttons, Inputs | `rounded-lg` | 8px |
| Badges, dropdown menu items | `rounded-md` | 6px |
| Avatars | `rounded-full` | — |

## 4. Buttons

[Button.tsx](src/components/ui/Button.tsx) is the only button implementation for CTAs — variant (`primary`/`secondary`/`ghost`) × size (`sm`/`md`/`lg`):

| Size | Text | Padding |
|---|---|---|
| `sm` | `text-label` (12px) | `px-3 py-1.5` |
| `md` | `text-body-lg` (14px) | `px-4 py-2.5` |
| `lg` | `text-body-lg` (14px) | `px-5 py-3` |

Route real actions (submit buttons, sign-in, "New project", etc.) through `Button` rather than a raw `<button>` with ad-hoc classes. Two categories are intentionally **not** routed through `Button`, since they're a different affordance, not a CTA:
- Navigational elements — "Back" links, icon-only close/remove buttons
- Inline editors — the Status/Priority/Assignee/Type dropdown triggers in `DetailFields.tsx`, tab strips (underline tabs in `ProjectDetailPage.tsx`), the theme-swatch picker in `SettingsPage.tsx`

These still pull their text size from the token table above — that was the actual inconsistency (raw `text-sm`/`text-xs` on ad-hoc elements), not the lack of a `<Button>` wrapper.
