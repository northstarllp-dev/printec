# Printec UI Design System

This document outlines the core UI design rules and tokens for the Printec Order Management System. It ensures that the specific UI color codes are **ALWAYS FOLLOWED** for consistency across the application.

## Core Colors

The application uses a strict two-color primary and secondary palette:

*   **Primary Color:** `#003262` (Deep Blue)
    *   Used for major UI accents, primary buttons, headers, active states, and focus rings.
*   **Secondary Color:** `#006E2F` (Deep Green)
    *   Used for success states, secondary highlights, completion stages, and positive metrics.

## CSS Variables (`src/app/globals.css`)

Always use the following CSS variables defined in Tailwind rather than hardcoding colors in components:

```css
  /* Core Brand */
  --color-primary: #003262;
  --color-secondary: #006e2f;

  /* Backgrounds & Surfaces */
  --color-background: #f8f9ff;
  --color-surface-container-lowest: #ffffff; /* White cards */
  --color-surface-container-low: #eff4ff; /* Light hovers */
```

### Usage with Tailwind

Instead of `bg-[#003262]`, use the defined variables:
*   Text: `text-[var(--color-primary)]`
*   Background: `bg-[var(--color-primary)]`
*   Border: `border-[var(--color-primary)]`

## UI/UX Principles (Precision Minimalism)

1.  **Elevation:** Do NOT use heavy drop shadows (`shadow-md`, `shadow-lg`, `shadow-2xl`). Instead, use flat design with 1px borders (`border-[var(--color-outline-variant)]`) or very faint shadows (`shadow-sm`) to define edges.
2.  **Typography:** Use the **Inter** font family. Tabular data should use tabular numbers (`tabular-nums`) for perfect alignment.
3.  **Status Badges:** Use outlined badge styles with an extremely faint background tint (10% opacity) and 20% opacity borders.
4.  **Icons:** Use `material-symbols-outlined` with rounded settings for consistent, minimal iconography.

## Recreating the UI Layouts

To recreate the clean dashboards:
*   Use white backgrounds for the cards (`bg-white` or `bg-[var(--color-surface-container-lowest)]`).
*   Keep the page background extremely light (`#f8f9ff`).
*   Avoid gradients and rounded bubbly corners. Use subtle border radii (`rounded-lg` or `rounded-xl`).
