# Printec UI Design System

This document outlines the core UI design rules and tokens for the Printec Order Management System. It ensures that the specific UI color codes are **ALWAYS FOLLOWED** for consistency across the application.

## 4-Color Strategy

The application uses a strict 4-color palette to maintain brand identity while allowing for visual variety:

*   **Primary (Navy Blue):** `#003568`
    *   Used for: Buttons, main brand, primary actions, sidebar active state, input focus
*   **Secondary (Indigo):** `#4F46E5`
    *   Used for: Secondary actions, filter/select tabs, sub-indicators, worksheet workflows, dashboard stat cards
*   **Accent (Orange):** `#F97316`
    *   Used for: Highlights, CTAs, urgency, badges, Customer Portal button
*   **Success (Green):** `#22c55e`
    *   Used **ONLY** for: Success states, completion stages, trackers, positive metrics, sidebar active indicator

## CSS Variables (`src/app/globals.css`)

Always use the following CSS variables defined in Tailwind rather than hardcoding colors in components:

```css
  /* Core Colors */
  --color-primary: #003568;       /* Navy Blue */
  --color-secondary: #4F46E5;     /* Indigo */
  --color-accent: #F97316;        /* Orange */
  --color-success: #22c55e;       /* Green (success only) */

  /* Backgrounds & Surfaces */
  --color-background: #f8f9ff;
  --color-surface-container-lowest: #ffffff; /* White cards */
  --color-surface-container-low: #eff4ff; /* Light hovers */
```

## Dark Sidebar Color Tokens

The admin layout uses a dark sidebar (extracted from UI screenshots):

```css
  /* Sidebar */
  --sidebar-bg: #0F172A;          /* Main sidebar background */
  --sidebar-active-bg: #1E293B;   /* Active nav item background */
  --sidebar-active-border: #22C55E; /* Active nav item left border (green indicator) */
  --sidebar-text: #64748B;        /* Inactive nav item text */
  --sidebar-text-active: #FFFFFF; /* Active nav item text */
  --sidebar-icon-active: #22C55E; /* Active nav item icon */

  /* Active orders badge */
  --sidebar-badge-bg: #1E3A5F;
  --sidebar-badge-border: #2563EB;
```

### Sidebar Badge Colors (per nav item)

| Section      | Badge Color |
|---|---|
| Orders       | `#1E40AF` (blue) |
| Enquiries    | `#22C55E` (green) |
| Customers    | `#7C3AED` (purple) |
| Production   | `#F97316` (orange) |
| Installation | `#0EA5E9` (sky) |
| Payments     | `#EC4899` (pink) |
| Support      | `#EF4444` (red) |

## Priority Badges (Order Cards)

| Priority | Background | Text | Border |
|---|---|---|---|
| High   | `#FEF2F2` | `#DC2626` | `#FECACA` |
| Medium | `#FFFBEB` | `#D97706` | `#FDE68A` |
| Low    | `#F0FDF4` | `#16A34A` | `#BBF7D0` |

### Usage with Tailwind

Instead of `bg-[#003568]`, use the defined variables:
*   Text: `text-[var(--color-primary)]`
*   Background: `bg-[var(--color-primary)]`
*   Border: `border-[var(--color-primary)]`

## UI/UX Principles (Precision Minimalism)

1.  **Elevation:** Do NOT use heavy drop shadows (`shadow-md`, `shadow-lg`, `shadow-2xl`). Instead, use flat design with 1px borders (`border-[var(--color-outline-variant)]`) or very faint shadows (`shadow-sm`) to define edges.
2.  **Typography:** Use the **Inter** font family. Tabular data should use tabular numbers (`tabular-nums`) for perfect alignment.
3.  **Status Badges:** Use outlined badge styles with an extremely faint background tint (10% opacity) and 20% opacity borders.
4.  **Icons:** Use `lucide-react` icons consistently across the application.

## Layout Principles

*   **Sidebar:** Dark (`#0F172A`), `240px` wide, collapsible to `64px`. Active items have a green left-border indicator (`#22C55E`).
*   **Top Bar:** White, `56px` height. Contains search bar, revenue/outstanding chips, notifications, user profile.
*   **Order Worksheet:** 3-panel layout — Left (order list 220px), Center (workflow steps 240px), Right (module content, flex-1).
*   **Dashboard:** Stats grid (4 cols), recent orders table, pending tickets sidebar, pipeline bar.

## Recreating the UI Layouts

To recreate the clean dashboards:
*   Use white backgrounds for the cards (`bg-white` or `bg-[var(--color-surface-container-lowest)]`).
*   Keep the page background extremely light (`#f8fafc`).
*   Avoid gradients and rounded bubbly corners. Use subtle border radii (`rounded-lg` or `rounded-xl`).
*   The sidebar is the ONLY dark element — everything else is light/white.
