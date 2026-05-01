# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Simresume is a modern online resume editor built with TanStack Start. It supports real-time preview, custom themes, AI-assisted writing, and PDF export.

## Development Commands

```bash
pnpm dev          # Start development server on port 3000
pnpm build        # Production build (outputs to dist/)
pnpm start        # Run production server (node server.mjs)
pnpm release      # Version bump using bumpp
```

## Architecture

### App Structure

- `src/app/` - Next.js App Router pages
  - `(public)/[locale]/` - Public pages (home, landing)
  - `app/dashboard/` - Dashboard with resume list, templates, AI settings
  - `app/workbench/[id]/` - Resume editor workbench
  - `api/` - API routes for AI polish, grammar check, image proxy

### State Management

Zustand stores in `src/store/`:
- `useResumeStore` - Main resume data, persisted to localStorage with optional file system sync
- `useAIConfigStore` - AI model configuration (API keys, model selection)
- `useGrammarStore` - Grammar check state
- `useThemeColorStore` - Theme customization

### Template System

Templates are registered in `src/components/templates/registry.ts`. Each template has:
- `config.ts` - Template metadata (colors, spacing, layout settings)
- `index.tsx` - React component rendering the template
- `sections/` - Individual section components (BaseInfo, Education, Experience, etc.)

To add a new template: create a directory under `templates/` with config.ts + index.tsx, then add one entry to `TEMPLATE_REGISTRY`.

### AI Integration

AI models configured in `src/config/ai.ts`. Supported providers:
- Doubao (requires API key + model ID)
- DeepSeek (requires API key)
- OpenAI-compatible (requires API key + model ID + endpoint)
- Gemini (requires API key + model ID)

API routes stream responses for real-time AI polish/grammar features.

### i18n

Localization files in `src/i18n/locales/` (zh.json, en.json). Uses a custom compatibility layer at `src/i18n/compat/` for Next.js integration.

### Key Types

- `ResumeData` (`src/types/resume.ts`) - Complete resume structure
- `ResumeTemplate` (`src/types/template.ts`) - Template configuration
- `AIModelType` (`src/config/ai.ts`) - Supported AI providers

## Notes

- The project uses pnpm as package manager (pnpm@10.3.0)
- Dev server runs on port 3000 by default
- No test suite is currently configured
- PDF export uses html2pdf.js with puppeteer for server-side rendering
