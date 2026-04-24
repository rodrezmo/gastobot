# GastoBot - Development Guidelines

## Project Overview

GastoBot is a PWA for personal expense tracking built with React + TypeScript + Supabase. The UI is in Spanish (es-AR).

- **Supabase project ID**: `cggnuvdsqbqxqsoqfwps`
- **Production URL**: https://gastobot.vercel.app
- **Vercel scope**: `rodrigos-projects-a42d87da/gastobot`

## Architecture

- **Frontend**: React 19, Vite 7, TypeScript strict mode, Tailwind CSS 4
- **Backend**: Supabase (Auth + PostgreSQL + RLS + Storage)
- **State**: Zustand stores in `src/stores/`
- **Routing**: React Router v7 with `<ProtectedRoute>` wrapper
- **WhatsApp Bot**: Supabase Edge Function en `supabase/functions/whatsapp-webhook/`

## Conventions

- **File naming**: PascalCase for components (`Button.tsx`), camelCase for everything else (`authStore.ts`)
- **Imports**: Use `@/` path alias mapped to `src/` (configured in tsconfig.app.json and vite.config.ts)
- **Styling**: Tailwind utility classes only. Use `cn()` from `@/utils/cn.ts`. No CSS modules.
- **Colors**: `slate-*` para grises, `primary-*` (indigo) para acciones, green para ingresos, red para gastos
- **Error handling**: Services throw; stores catch and surface via state; pages show inline
- **Environment variables**: Prefixed with `VITE_`. Never commit `.env.local`.
- **Types**: Shared types in `src/types/`. Database types in `src/lib/database.types.ts` (auto-generado).

## Key Patterns

- Zustand stores are the single source of truth for app state
- Service layer (`src/services/`) wraps all Supabase calls and returns typed data
- Components use stores via hooks; pages orchestrate data fetching via `useEffect`
- Protected routes check `useAuthStore` and redirect to `/login`
- UI theme (light/dark) persisted in localStorage via Zustand persist

## Supabase RLS — Reglas críticas

- NUNCA crear RLS policies con subqueries circulares entre tablas
- NUNCA crear self-referential RLS policies (causan recursión infinita)
- Usar funciones `SECURITY DEFINER` para acceso cruzado entre tablas
- Cast entre enums distintos via `::TEXT`
- Migraciones numeradas: `supabase/migrations/NNN_nombre.sql` (NNN = 3 dígitos)

## WhatsApp Bot

- Edge Function: `supabase/functions/whatsapp-webhook/`
- Archivos: `index.ts`, `handle-message.ts`, `parse-message.ts`
- Respuestas via TwiML (NO Twilio REST API outbound)
- `handle-message.ts` retorna `Promise<string>`, `index.ts` lo envuelve en TwiML
- Secrets: `GEMINI_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
- Tabla `bot_sessions`: sin RLS, acceso via service_role

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Type-check + production build (siempre correr antes de deploy)
npm run lint      # ESLint
npm run format    # Prettier
npx vercel --prod # Deploy a producción
```

## Agentes disponibles

Usá estos agentes para tareas específicas en lugar de hacerlo manualmente:

- **`supabase-migrator`** — crear y aplicar migraciones, regenerar tipos. Úsalo para cualquier cambio de schema.
- **`feature-scaffolder`** — scaffoldear features completas (service + store + page + componentes).
- **`bot-deployer`** — modificar y deployar la Edge Function del bot de WhatsApp.

## Skills disponibles

Slash commands disponibles en este proyecto:

- **`/deploy`** — build + deploy a Vercel producción
- **`/sync-types`** — regenerar `database.types.ts` desde Supabase
- **`/check-bot`** — ver últimos logs de la Edge Function
- **`/new-migration <nombre>`** — crear archivo de migración numerado

## Important Files

- `src/lib/supabase.ts` — Supabase client
- `src/lib/database.types.ts` — Tipos generados (no editar a mano)
- `src/stores/authStore.ts` — Auth state
- `src/App.tsx` — Route definitions
- `src/components/layout/Sidebar.tsx` — Nav links (desktop + mobile bottom nav)
- `ARCHITECTURE.md` — Full architecture document

## Notes

- UI en español (es-AR): "Gastos", "Ingresos", "Transacciones", "Reportes", "Panel", "Configuracion"
- Moneda default: ARS (Peso Argentino)
- El dashboard muestra el mes actual con balance hero card (gradiente indigo→violet)
- Mobile: bottom navigation bar. Desktop: sidebar fijo izquierda.
