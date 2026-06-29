# Printoms UI Design System

This document outlines the core UI design rules and tokens for the Printoms Order Management System. It ensures that the specific UI color codes are **ALWAYS FOLLOWED** for consistency across the application.

## Core Color Strategy

The application uses a unified color palette to maintain brand identity while allowing for visual variety:

*   **Primary (Deep Blue):** `#1E40AF`
    *   Used for: Buttons, main brand, primary actions, input focus, focus rings
*   **Accent (Orange):** `#F97316`
    *   Used for: Highlights, CTAs, urgency, badges
*   **Success (Green):** `#10B981`
    *   Used for: Success states, completion stages, trackers, positive metrics

## Main UI Tokens

*   **Page Background:** `#F4F5F8`
*   **Card/Panel:** `#FFFFFF`
*   **Foreground Text:** `#111827`
*   **Muted Text:** `#6B7280`
*   **Muted Surface:** `#F1F3F6`
*   **Border:** `rgba(17, 24, 39, 0.08)`
*   **Input Background:** `#F9FAFB`
*   **Focus Ring:** `#1E40AF`

## Dark Sidebar Color Tokens

The portal and admin layout uses a dark sidebar with the following design:

*   **Background:** `#0C0F1A`
*   **Text/Icons:** `#94A3B8`
*   **Active Item Background:** `#1A2035`
*   **Active Item Text:** `#E2E8F0`
*   **Accent (Orange):** `#F97316`
*   **Border:** `rgba(255,255,255,0.06)`

## Status Colors

| Stage | Color | Styling Rule / Badge Tint |
|---|---|---|
| **Enquiry** | `#8B5CF6` (violet) | 10% opacity bg, 20% opacity border |
| **Site Visit** | `#3B82F6` (blue) | 10% opacity bg, 20% opacity border |
| **Quote** | `#F59E0B` (amber) | 10% opacity bg, 20% opacity border |
| **Design** | `#EC4899` (pink) | **Dot only** color, badge uses text-pink-700 / bg-pink-50 |
| **Installation** | `#14B8A6` (teal) | 10% opacity bg, 20% opacity border |
| **Completed** | `#10B981` (green) | 10% opacity bg, 20% opacity border |

## Priority & Urgency Colors

| Priority | Text Color | Background |
|---|---|---|
| **High** | `#DC2626` | `bg-red-50` (`#FEF2F2`) |
| **Medium** | `#D97706` | `bg-amber-50` (`#FFFBEB`) |
| **Low** | `#6B7280` | `bg-gray-100` (`#F3F4F6`) |

## Semantic Colors

*   **Success Green:** `#10B981`
*   **Warning Amber:** `#F59E0B`
*   **Destructive Red:** `#DC2626`

## CSS Variables (`src/app/globals.css`)

Always use the following CSS variables defined in Tailwind rather than hardcoding colors in components:

```css
  /* Core Colors */
  --color-primary: #1E40AF;
  --color-accent: #F97316;
  --color-success: #10B981;

  /* Backgrounds & Surfaces */
  --color-background: #F4F5F8;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #F1F3F6;
```

### Usage with Tailwind

Instead of `bg-[#1E40AF]`, use the defined variables or Tailwind theme mappings:
*   Text: `text-[var(--color-primary)]`
*   Background: `bg-[var(--color-primary)]`
*   Border: `border-[var(--color-outline-variant)]`

## UI/UX Principles (Precision Minimalism)

1.  **Elevation:** Do NOT use heavy drop shadows (`shadow-md`, `shadow-lg`, `shadow-2xl`). Instead, use flat design with 1px borders (`border-[var(--color-outline-variant)]`) or very faint shadows (`shadow-sm`) to define edges.
2.  **Typography:** Use the **Inter** font family. Tabular data should use tabular numbers (`tabular-nums`) for perfect alignment.
3.  **Status Badges:** Use outlined badge styles with an extremely faint background tint (10% opacity) and 20% opacity borders.
4.  **Icons:** Use `lucide-react` icons consistently across the application.
