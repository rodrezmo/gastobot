# GastoBot

PWA de control de gastos personales. Registra ingresos y gastos, categoriza transacciones, visualiza reportes con graficos y controla tu presupuesto.

## Tech Stack

- **Framework**: React 19 + TypeScript (strict)
- **Build**: Vite 7
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (Auth + PostgreSQL + RLS)
- **State**: Zustand
- **Charts**: Recharts
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Dates**: date-fns

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Project Structure

```
src/
  components/     # Reusable UI and feature components
    ui/           # Button, Input, Card, Modal, etc.
    layout/       # MainLayout, AuthLayout, Navbar, Sidebar
    auth/         # LoginForm, RegisterForm, ProtectedRoute
    dashboard/    # SummaryCards, RecentTransactions, SpendingChart
    transactions/ # TransactionList, TransactionForm, FilterBar
    reports/      # PieChart, BarChart, DateRangePicker
  pages/          # Route-level page components
  stores/         # Zustand stores (auth, transactions, categories, UI)
  services/       # Supabase API service layer
  hooks/          # Custom React hooks
  lib/            # Supabase client and database types
  types/          # TypeScript type definitions
  utils/          # Formatting helpers (currency, date, cn)
```

## Features (v1)

- Email/password authentication
- Dashboard with income/expense summary and charts
- Full CRUD for transactions with category assignment
- Filter transactions by type, category, date range, and search
- Reports with pie charts, bar charts, and category breakdowns
- User profile settings (name, currency)
- Dark/light theme toggle
- Responsive mobile-first design
- PWA manifest for installability
