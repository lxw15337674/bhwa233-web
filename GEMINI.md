# Todo Web Application (233tools)

This is a comprehensive multi-functional web application built with **Next.js** (App Router). It integrates productivity tools (Todo, Counter) with entertainment features (TFT Guides, Fishing Time) and media processing capabilities.

## Project Overview

*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, Radix UI (shadcn/ui inspired), Lucide React
*   **State Management:** Zustand
*   **Media Processing:** WebAssembly (`wasm-vips` for images, `@ffmpeg/ffmpeg` for audio/video)
*   **PWA:** Supported via `@serwist/next`
*   **Testing:** Vitest, Playwright

## Building and Running

The project uses **pnpm** as the package manager.

### Prerequisites
*   Node.js (Latest LTS recommended)
*   pnpm

### Key Commands

| Command | Description |
| :--- | :--- |
| `pnpm install` | Install dependencies. |
| `pnpm dev` | Start the development server (usually on port 3000). |
| `pnpm build` | Build the application for production. Automatically runs `scripts/copy-wasm-vips.js`. |
| `pnpm start` | Start the production server. |
| `pnpm lint` | Run ESLint to check for code quality issues. |
| `pnpm format` | Format code using Prettier. |
| `pnpm test` | Run unit tests with Vitest. |

> **Note:** The `README.md` mentions Bun, but the `package.json` scripts and lockfile (`pnpm-lock.yaml`) indicate `pnpm` is the primary package manager.

## Development Conventions

### Architecture
*   **App Router:** The project uses the Next.js App Router located in the `app/` directory.
    *   Routes are defined by folder structure (e.g., `app/fishingTime/page.tsx`).
    *   `app/layout.tsx` handles global providers (`ClientProviders`, `TranslationProvider`) and layout.
*   **Source Code:** The core logic resides in `src/`.
    *   `src/components`: Reusable UI components. `src/components/ui` contains primitives (likely shadcn/ui).
    *   `src/stores`: Global state management using Zustand.
    *   `src/lib`: Utility functions, I18n helpers, and API wrappers.
    *   `src/hooks`: Custom React hooks.

### Media Processing & WebAssembly
*   **Headers:** The application relies on `SharedArrayBuffer` for high-performance media processing (wasm-vips). This requires **Cross-Origin Embedder Policy (COEP)** and **Cross-Origin Opener Policy (COOP)** headers.
*   **Configuration:** These headers are configured in `next.config.ts` specifically for routes like `/processor/image`.
*   **Build Step:** `scripts/copy-wasm-vips.js` is critical for copying WASM binaries to the `public` folder during build.

### Internationalization (I18n)
*   The project implements a custom I18n solution found in `src/lib/i18n`.
*   Translations are likely loaded in `app/layout.tsx` and provided via context.

### PWA
*   PWA functionality is configured in `next.config.ts` using `withSerwistInit`.
*   Service worker logic is in `app/sw.ts`.

## Directory Structure

```text
├── .github/            # GitHub Actions and configurations
├── app/                # Next.js App Router pages and layouts
├── public/             # Static assets (images, icons, wasm binaries)
├── scripts/            # Build and utility scripts
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities and libraries
│   └── stores/         # Zustand state stores
├── next.config.ts      # Next.js configuration (WASM, Headers, PWA)
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```
