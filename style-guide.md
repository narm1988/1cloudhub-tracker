# 1CloudHub Tracker — Style Guide

A living reference for the design tokens, components, and conventions used across the app. Typography follows the Pipeline Pulse guidelines (Inter + JetBrains Mono, rem-based scale). Colors and component patterns are project-specific.

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

Rem-based scale adopted from Pipeline Pulse guidelines. Defined in `tailwind.config.js` under `theme.extend.fontSize`.

| Token | Size | Line Height | Letter Spacing | Role |
|---|---|---|---|---|
| `text-caption` | 0.75rem (12px) | 1.4 | — | Metadata, timestamps, badges, small UI text |
| `text-label` | 0.875rem (14px) | 1.5 | — | Field labels, dropdown items, form controls |
| `text-body` | 0.875rem (14px) | 1.5 | — | Default body text, descriptions, inputs, buttons |
| `text-subhead` | 1.125rem (18px) | 1.4 | — | Card titles, section headers, nav items |
| `text-heading` | 1.875rem (30px) | 1.2 | -0.02em | Page titles, modal titles |
| `text-display` | 2.25rem (36px) | 1.2 | -0.02em | Hero text (login page tagline) |
| `text-metric` | 2.5rem (40px) | 1.2 | -0.02em | Key numbers on dashboards (future) |

### 2.3 Typography Guidelines

- **Line height**: 1.5 for body/label text, 1.4 for subheads, 1.2 for headings/display
- **Letter spacing**: -0.02em for headings and display text, normal for body
- **Max line length**: 65-75 characters for readability
- **Font weight**: 400 for body, 500 for medium emphasis, 600 for labels/buttons/headings, 700 for bold display
- **Monospace usage**: Display IDs (`1CH-101`), project keys, story points, dates, emails, code

### 2.4 Migration from Old Scale

| Old Token (removed) | New Token |
|---|---|
| `text-micro` (10px) | `text-caption` (0.75rem) |
| `text-body-lg` (14px) | `text-body` (0.875rem) |

---

## 3. Spacing & Border Radius

Spacing uses Tailwind's default 4px grid: `p-3.5`/`p-5`/`p-6`, `gap-3`/`gap-4`/`gap-5`, `mb-4`/`mb-5`.

| Role | Class | Approx Value |
|---|---|---|
| Cards, Modals | `rounded-xl` | 12px |
| Buttons, Inputs, Dropdowns | `rounded-lg` | 8px |
| Badges, Tags, Menu items | `rounded-md` | 6px |
| Avatars | `rounded-full` | 50% |

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
