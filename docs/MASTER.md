# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Printec
**Generated:** 2026-06-13 10:53:55
**Category:** SaaS (General)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#7C3AED` | `--color-primary` |
| Secondary | `#A78BFA` | `--color-secondary` |
| CTA/Accent | `#F97316` | `--color-cta` |
| Background | `#FAF5FF` | `--color-background` |
| Text | `#4C1D95` | `--color-text` |

**Color Notes:** Excitement purple + action orange

### Typography

- **Heading Font:** Poppins
- **Body Font:** Open Sans
- **Mood:** modern, professional, clean, corporate, friendly, approachable
- **Google Fonts:** [Poppins + Open Sans](https://fonts.google.com/share?selection.family=Open+Sans:wght@300;400;500;600;700|Poppins:wght@400;500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #F97316;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #7C3AED;
  border: 2px solid #7C3AED;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #FAF5FF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #7C3AED;
  outline: none;
  box-shadow: 0 0 0 3px #7C3AED20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Glassmorphism

**Keywords:** Frosted glass, transparent, blurred background, layered, vibrant background, light source, depth, multi-layer

**Best For:** Modern SaaS, financial dashboards, high-end corporate, lifestyle apps, modal overlays, navigation

**Key Effects:** Backdrop blur (10-20px), subtle border (1px solid rgba white 0.2), light reflection, Z-depth

### Page Pattern

**Pattern Name:** Hero + Features + CTA

- **CTA Placement:** Above fold
- **Section Order:** Hero > Features > CTA

---

## Anti-Patterns (Do NOT Use)

- ❌ Excessive animation
- ❌ Dark mode by default

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Architecture & Security Best Practices

As part of the v2 Production Grade refactor, all new development must adhere to the following standards:

### 1. Database & Schema
- **UUID Primary Keys:** All tables (`users`, `orders`, `customers`, `enquiries`, etc.) must use secure UUIDs (`gen_random_uuid()`) instead of auto-incrementing integers or strings to prevent enumeration attacks.
- **Multi-Tenancy:** All major tables must include a `company_id` (UUID) column with an appropriate foreign key index to ensure data isolation.
- **Row Level Security (RLS):** All tables must have strict RLS policies enabled (`TO authenticated USING (true)`) to completely block unauthenticated database access.

### 2. Next.js Server Components & Data Fetching
- **No Global Client Context for Data:** Do NOT use `DashboardContext` or similar global React Providers to fetch and store sensitive database arrays on the client side.
- **Server Components First:** Always fetch data asynchronously on the server (`page.tsx` as an `async function`) using Supabase SSR (`@supabase/ssr`).
- **Props Drilling for Initial State:** Pass the securely fetched data down to Client Components via props (e.g., `initialOrders`, `initialCustomers`).

### 3. Server Actions (Mutations)
- **Secure Mutations:** All database mutations (INSERT, UPDATE, DELETE) must occur securely on the server using Next.js Server Actions (e.g., functions in `src/app/actions/` marked with `"use server"`).
- **Cache Invalidation:** Always use `revalidatePath('/route')` within Server Actions to automatically trigger UI updates after a successful mutation.

### 4. Route Protection
- **Middleware Check:** The Next.js `middleware.ts` must actively intercept requests to protected routes (like `/admin/*` and `/staff/*`), verify the Supabase JWT via `supabase.auth.getUser()`, and redirect unauthenticated requests to `/login`.

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
