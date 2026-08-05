# 1CloudHub Tracker — Style Guide

A living reference for the design tokens, components, and conventions used across the app. Typography, spacing, and border radius are **fully aligned with Pipeline Pulse design tokens**. Colors and component patterns remain project-specific.

> **Pipeline Pulse alignment**: `index.css` exposes all `--pp-*` CSS custom properties (typography, spacing, radius). `tailwind.config.js` maps both standard Tailwind utility names (`text-xs`…`text-4xl`, `rounded-sm`…`rounded-2xl`) and semantic aliases (`text-caption`, `text-heading`, etc.) to the same Pipeline Pulse values.

---

## 1. Color Palette

Defined in `tailwind.config.js` under `theme.extend.colors`. Unchanged from project inception.

| Token | Hex | Usage |
|---|---|---|
| `brand` | `#5B5FEF` | Primary CTA, active nav, links |
| `brand-deep` | `#4548C9` | Hover state for brand |
| `brand-soft` | `#EEF0FE` | Brand tint backgrounds |
| `ink` | `#14171F` | Primary text, headings |
| `ink-soft` | `#1C2030` | Secondary dark surface |
| `ink-faint` | `#2A2F42` | Subtle dark surface (sidebar active) |
| `paper` | `#F5F6F8` | Page background |
| `success` | `#1E9E6B` | Done status, positive feedback |
| `success-soft` | `#E7F6EF` | Success tint |
| `warning` | `#C6820F` | Draft status, cautions |
| `warning-soft` | `#FBF0DD` | Warning tint |
| `danger` | `#E5484D` | Errors, destructive actions |
| `danger-soft` | `#FDECEC` | Danger tint |
| `info` | `#3B82F6` | In Progress status, informational |
| `info-soft` | `#EAF1FE` | Info tint |

Gray tones use Tailwind defaults (`gray-100` through `gray-600`).

---

## 2. Typography

### 2.1 Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Monaco, monospace;
```

Tailwind classes:
- `font-sans` / `font-display` / `font-body` — all resolve to Inter with system fallbacks
- `font-mono` — JetBrains Mono with monospace fallbacks

Google Fonts loads: Inter (400, 500, 600, 700) and JetBrains Mono (400, 500).

### 2.2 Type Scale

Rem-based scale matching Pipeline Pulse design tokens exactly. Both standard Tailwind names and semantic aliases are available.

| Tailwind Class | PP Token | Size | Line Height | Letter Spacing | Role |
|---|---|---|---|---|---|
| `text-xs` | `--pp-font-size-xs` | 0.75rem (12px) | 1.5 | — | Small UI text |
| `text-sm` | `--pp-font-size-sm` | 0.875rem (14px) | 1.5 | — | Default body, controls |
| `text-base` | `--pp-font-size-md` | 1rem (16px) | 1.5 | — | Larger body text |
| `text-lg` | `--pp-font-size-lg` | 1.125rem (18px) | 1.5 | — | Section headers, nav |
| `text-xl` | `--pp-font-size-xl` | 1.25rem (20px) | 1.25 | — | Sub-page headings |
| `text-2xl` | `--pp-font-size-2xl` | 1.5rem (24px) | 1.25 | -0.015em | Page titles |
| `text-3xl` | `--pp-font-size-3xl` | 1.875rem (30px) | 1.25 | -0.02em | Large headings |
| `text-4xl` | `--pp-font-size-4xl` | 2.25rem (36px) | 1.25 | -0.02em | Hero/display text |

**Semantic aliases** (convenience classes that map to the same PP values):

| Token | Size | Line Height | Letter Spacing | Role |
|---|---|---|---|---|
| `text-caption` | 0.75rem (12px) | 1.4 | — | Metadata, timestamps, badges |
| `text-label` | 0.875rem (14px) | 1.5 | — | Field labels, dropdown items |
| `text-body` | 0.875rem (14px) | 1.5 | — | Default body text, inputs, buttons |
| `text-body-lg` | 1rem (16px) | 1.5 | — | Descriptions, larger body |
| `text-subhead` | 1.125rem (18px) | 1.4 | — | Card titles, section headers |
| `text-heading` | 1.5rem (24px) | 1.25 | -0.015em | Page titles, modal titles |
| `text-heading-lg` | 1.875rem (30px) | 1.25 | -0.02em | Large headings, login title |
| `text-display` | 2.25rem (36px) | 1.25 | -0.02em | Hero text (login tagline) |
| `text-metric` | 2.5rem (40px) | 1.2 | -0.02em | Key numbers on dashboards |

### 2.3 Font Weights (Pipeline Pulse aligned)

| Tailwind Class | PP Token | Value |
|---|---|---|
| `font-normal` | `--pp-font-weight-normal` | 400 |
| `font-medium` | `--pp-font-weight-medium` | 500 |
| `font-semibold` | `--pp-font-weight-semibold` | 600 |
| `font-bold` | `--pp-font-weight-bold` | 700 |

### 2.4 Line Heights (Pipeline Pulse aligned)

| Tailwind Class | PP Token | Value |
|---|---|---|
| `leading-tight` | `--pp-line-height-tight` | 1.25 |
| `leading-normal` | `--pp-line-height-normal` | 1.5 |
| `leading-relaxed` | `--pp-line-height-relaxed` | 1.75 |

### 2.5 Typography Guidelines

- **Line height**: 1.5 for body/label text, 1.4 for subheads, 1.25 for headings/display
- **Letter spacing**: -0.02em for headings and display text, normal for body
- **Max line length**: 65-75 characters for readability
- **Font weight**: 400 for body, 500 for medium emphasis, 600 for labels/buttons/headings, 700 for bold display
- **Monospace usage**: Display IDs (`1CH-101`), project keys, story points, dates, emails, code

---

## 3. Spacing & Border Radius

### 3.1 Spacing Scale (Pipeline Pulse aligned)

Matches `--pp-space-*` tokens exactly. Defined in `tailwind.config.js` under `theme.extend.spacing`.

| Tailwind | PP Token | Value | Use Case |
|---|---|---|---|
| `0` | `--pp-space-0` | 0rem | Reset |
| `1` | `--pp-space-1` | 0.25rem (4px) | Tight groupings |
| `2` | `--pp-space-2` | 0.5rem (8px) | Related elements |
| `3` | `--pp-space-3` | 0.75rem (12px) | Small gaps |
| `4` | `--pp-space-4` | 1rem (16px) | Standard spacing |
| `5` | `--pp-space-5` | 1.25rem (20px) | Medium gaps |
| `6` | `--pp-space-6` | 1.5rem (24px) | Section breaks |
| `8` | `--pp-space-8` | 2rem (32px) | Major sections |
| `10` | `--pp-space-10` | 2.5rem (40px) | Large gaps |
| `12` | `--pp-space-12` | 3rem (48px) | Page sections |
| `16` | `--pp-space-16` | 4rem (64px) | XL spacing |
| `20` | `--pp-space-20` | 5rem (80px) | Page-level spacing |

### 3.2 Border Radius (Pipeline Pulse aligned)

Matches `--pp-radius-*` tokens exactly. Defined in `tailwind.config.js` under `theme.extend.borderRadius`.

| Tailwind Class | PP Token | Value | Use Case |
|---|---|---|---|
| `rounded-none` | `--pp-radius-none` | 0 | No rounding |
| `rounded-sm` | `--pp-radius-sm` | 0.125rem (2px) | Subtle rounding |
| `rounded` / `rounded-md` | `--pp-radius-md` | 0.375rem (6px) | Badges, tags, menu items |
| `rounded-lg` | `--pp-radius-lg` | 0.5rem (8px) | Buttons, inputs, dropdowns |
| `rounded-xl` | `--pp-radius-xl` | 0.75rem (12px) | Cards, modals |
| `rounded-2xl` | `--pp-radius-2xl` | 1rem (16px) | Large containers |
| `rounded-full` | `--pp-radius-full` | 9999px | Avatars, pills |

---

## 4. Component Library

All shared UI primitives live in `src/components/ui/`.

### Button

`Button.tsx` — the single CTA component. Variants: `primary` | `secondary` | `ghost`. Sizes: `sm` | `md` | `lg`.

| Size | Text Token | Padding |
|---|---|---|
| `sm` | `text-label` | `px-3 py-1.5` |
| `md` | `text-body` | `px-4 py-2.5` |
| `lg` | `text-body` | `px-5 py-3` |

All buttons are `font-semibold`, `rounded-lg`, with `gap-2` for icon + label.

### Card

`Card.tsx` — white container with `border border-gray-200 rounded-xl`. Padding: `none` | `sm` (p-3.5) | `md` (p-5) | `lg` (p-6).

### Modal

`Modal.tsx` — overlay `bg-black/50`, centered card. Title uses `text-heading`. Animations: `animate-fade-in` backdrop, `animate-pop-in` dialog.

### Input

`Input.tsx` — with optional label, left icon, error state. Uses `text-body` for input text and labels, `rounded-lg` with brand focus ring.

### Avatar

`Avatar.tsx` — initials avatar with deterministic color. Sizes: `sm` (w-5, text-caption), `md` (w-7, text-caption), `lg` (w-9, text-label).

### StatusBadge

`StatusBadge.tsx` — status pill using `STATUS_META` colors. Uses `text-caption`, `rounded-md`.

### EmptyState

`EmptyState.tsx` — centered placeholder. Title: `text-subhead`, description: `text-body`.

### LoadingSkeleton

`LoadingSkeleton.tsx` — pulse-animated placeholder. Variants: `cards` (grid) or `rows` (list).

### Pagination

`Pagination.tsx` — prev/next with page count. Uses `Button` (secondary, sm) and `text-label`.

---

## 5. Animations

| Utility Class | Duration | Use Case |
|---|---|---|
| `animate-fade-in-up` | 0.4s | Page content entrance |
| `animate-fade-in` | 0.35s | Modal backdrop |
| `animate-pop-in` | 0.18s | Modal dialog, dropdowns |
| `animate-drawer-slide-in` | 0.25s | Notification drawer |
| `animate-orbit-spin` | 16s | Login page orbital decoration |
| `animate-float` | 6s | Login page floating elements |
| `animate-twinkle` | 3.2s | Login page star particles |
| `animate-aurora-*` | 18-26s | Login page aurora blobs |

---

## 6. Sidebar Themes

Four sidebar themes in `src/lib/themes.ts`, selectable from Settings:

| ID | Name | Background | Accent | Particle |
|---|---|---|---|---|
| `midnight` | Midnight | `#14171F` | `#5B5FEF` | Stars |
| `ember` | Ember | `#1A1210` | `#F59E0B` | Embers |
| `daylight` | Daylight | `#F8F4EC` | `#5B5FEF` | Dust |
| `frost` | Frost | `#EAF1F6` | `#0EA5E9` | Stars |

---

## 7. Status & Priority Tokens

### Status

| Status | Tailwind Class |
|---|---|
| Created | `bg-slate-100 text-slate-600` |
| Draft | `bg-amber-50 text-amber-700` |
| In Progress | `bg-blue-50 text-blue-600` |
| In Review | `bg-violet-50 text-violet-600` |
| Done | `bg-emerald-50 text-emerald-600` |

### Priority

| Priority | Icon |
|---|---|
| Critical | Red circle |
| High | Orange circle |
| Medium | Yellow circle |
| Low | Green circle |

### Issue Types

| Type | Icon | Color Class |
|---|---|---|
| Story | Book | `bg-emerald-50 text-emerald-700` |
| Task | Check | `bg-blue-50 text-blue-700` |
| Bug | Bug | `bg-red-50 text-red-700` |
| Sub-task | Clip | `bg-gray-100 text-gray-600` |

---

## 8. Layout Structure

```
Sidebar (w-56, themed)  |  TopBar (h-[60px], white, border-b)
                        |  Search | Notifications | User
                        |  ─────────────────────────────────
                        |  <main> p-6, overflow-auto
                        |    <Outlet /> (page content)
                        |  Footer
```

- Root: `flex min-h-screen bg-paper font-body`
- Sidebar: fixed width `w-56`, themed background
- Main area: `flex-1 flex flex-col min-w-0`

---

## 9. Conventions

1. **Use only the 7 type tokens** — no raw Tailwind `text-xs`/`text-sm`/`text-base`/etc.
2. **Cards over raw divs** — wrap white bordered containers in `<Card>`.
3. **Buttons for CTAs only** — use `<Button>` for submit/create/navigate actions.
4. **Font-semibold for labels and headings** — body text at weight 400.
5. **Gray-200 borders** — default border for cards, inputs, dividers.
6. **Brand focus ring** — `focus:border-brand focus:ring-1 focus:ring-brand/30`.
7. **Monospace for IDs/data** — display IDs, keys, points, dates use `font-mono`.
8. **Icon sizing** — 14px in sm buttons, 16px inline, 18px in nav/topbar, 32px empty states.
9. **Staggered animations** — list items use `animationDelay` for polish.
10. **Negative letter-spacing on headings** — `-0.02em` on `text-heading` and `text-display`.

---

## 10. Accessibility

- **Color contrast**: 4.5:1 minimum for text, 3:1 for large text and interactive elements
- **Keyboard navigation**: All interactive elements accessible, logical tab order
- **Focus indicators**: Visible brand-colored ring on all focusable elements
- **ARIA labels**: Applied to icon-only buttons and interactive elements
- **Semantic HTML**: Proper heading hierarchy, landmark regions
