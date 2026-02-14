# GastoBot - Development Guidelines

## Project Overview

GastoBot is a PWA for personal expense tracking built with React + TypeScript + Supabase. The UI is in Spanish (es-AR).

## Architecture

- **Frontend**: React 19, Vite 7, TypeScript strict mode, Tailwind CSS 4
- **Backend**: Supabase (Auth + PostgreSQL + RLS + Storage)
- **State**: Zustand stores in `src/stores/`
- **Routing**: React Router v7 with `<ProtectedRoute>` wrapper

## Conventions

- **File naming**: PascalCase for components (`Button.tsx`), camelCase for everything else (`authStore.ts`)
- **Imports**: Use `@/` path alias mapped to `src/` (configured in tsconfig.app.json and vite.config.ts)
- **Styling**: Tailwind utility classes only. Use `cn()` helper from `@/utils/cn.ts` for conditional classes. No CSS modules.
- **Error handling**: Services throw errors; stores catch and surface via state; pages show error messages inline
- **Environment variables**: Prefixed with `VITE_`. Never commit `.env.local`.
- **Types**: All shared types in `src/types/`. Database types in `src/lib/database.types.ts`.

## Key Patterns

- Zustand stores are the single source of truth for app state
- Service layer (`src/services/`) wraps all Supabase calls and returns typed data
- Components use stores via hooks; pages orchestrate data fetching via `useEffect`
- Protected routes check `useAuthStore` for session and redirect to `/login`
- UI theme (light/dark) is persisted in localStorage via Zustand persist middleware

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Type-check + production build
npm run lint      # ESLint
npm run format    # Prettier
```

## Important Files

- `src/lib/supabase.ts` - Supabase client (typed with Database generics)
- `src/lib/database.types.ts` - Generated Supabase types
- `src/stores/authStore.ts` - Authentication state
- `src/App.tsx` - Route definitions
- `ARCHITECTURE.md` - Full architecture document

## Notes

- The app uses Spanish labels: "Gastos", "Ingresos", "Transacciones", "Reportes", "Panel", "Configuracion"
- Currency defaults to ARS (Argentine Peso)
- Supabase RLS ensures data isolation per user
- Budget features are designed (schema exists) but UI is deferred to v2
