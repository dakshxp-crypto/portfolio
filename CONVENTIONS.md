# Coding & Design Conventions

This document outlines the architectural standards, folder structure, design token system, and rules for this personal portfolio project.

## Tech Stack
- **Framework**: Astro 5 (TypeScript strict mode)
- **Deployment Platform**: Vercel (static rendering by default)
- **CSS**: Plain CSS variables and native components (no CSS frameworks/Tailwind/UI kits unless explicitly requested)

## Directory Structure
```
├── src/
│   ├── layouts/          # Layout wrappers (e.g. BaseLayout.astro)
│   ├── components/       # Reusable modular UI components (sections, grids, buttons)
│   ├── pages/            # Page routes (index.astro, etc.)
│   │   └── api/          # Serverless API routes (e.g. chatbot /api/chat)
│   ├── content/          # Markdown/MDX files for case studies
│   │   ├── projects/     # Case studies folder
│   │   └── config.ts     # Content Collections configuration schema
│   └── styles/           # Global styles and styling assets (global.css)
```

## Styling & Design Tokens
All UI styling must adhere to the design token system configured in `src/styles/global.css`.

- **Primary CSS Custom Properties**:
  - `--bg`: `#EFEFEF` (Default body background color)
  - `--text`: `#1A1A1A` (Default text color)
  - `--accent`: `#E75F38` (Accent/CTA color)
  - `--radius-pill`: `999px` (Pill shapes)
  - Spacing variables: `--space-2xs` up to `--space-3xl`
  - Typography variables: `--font-xs` up to `--font-xxl`
- **Rules**:
  - **No Hardcoded Colors**: Always use design token CSS variables (e.g. `color: var(--accent);` instead of `color: #E75F38;`).
  - **Type & Spacing Scales**: Keep typography sizes and spacing aligned with the custom scale properties.
  - **Font Face**: The default typeface is the "Satoshi" font from Fontshare, with `system-ui` fallbacks.
