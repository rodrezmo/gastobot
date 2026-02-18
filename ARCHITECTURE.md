# GastoBot - Architecture Document

> PWA de control de gastos personales

---

## 1. Project Overview

GastoBot is a Progressive Web App for personal expense tracking. Users can log income and expenses, categorize transactions, view spending reports with charts, and set budgets. The app uses Supabase for authentication, database, and row-level security so each user's data is fully isolated.

**Key Goals:**
- Fast, mobile-first PWA with offline-capable UI
- Secure multi-tenant data isolation via Supabase RLS
- Clean component architecture for maintainability
- v1 ships core functionality; v2 adds budgets, shared expenses, multi-currency

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18+ |
| Build Tool | Vite 5+ |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3+ |
| Backend/Auth/DB | Supabase (Auth + PostgreSQL + RLS + Storage) |
| State Management | Zustand |
| Charts | Recharts |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Date Handling | date-fns |
| Icons | Lucide React |

---

## 3. Database Schema (Supabase / PostgreSQL)

### 3.1 Tables

#### `profiles`

Extends Supabase `auth.users`. Created automatically via a trigger on signup.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'ARS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `categories`

```sql
CREATE TYPE category_type AS ENUM ('income', 'expense');

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'circle',
  color TEXT NOT NULL DEFAULT '#6366f1',
  type category_type NOT NULL DEFAULT 'expense',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_user_id ON public.categories(user_id);
```

#### `transactions`

```sql
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type transaction_type NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
```

#### `budgets` (v2 - schema defined now, UI later)

```sql
CREATE TYPE budget_period AS ENUM ('weekly', 'monthly');

CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  period budget_period NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
```

### 3.2 Row-Level Security (RLS)

Enable RLS on every table. Each policy restricts access to rows where `user_id = auth.uid()` (or `id = auth.uid()` for profiles).

```sql
-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON public.categories FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own categories"
  ON public.categories FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING (user_id = auth.uid());

-- transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (user_id = auth.uid());

-- budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
  ON public.budgets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own budgets"
  ON public.budgets FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own budgets"
  ON public.budgets FOR DELETE
  USING (user_id = auth.uid());
```

### 3.3 Trigger: Auto-create profile on signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 3.4 Seed: Default categories

After profile creation, seed default categories via a second trigger or via the app's `onSignUp` flow:

```
Expense: Comida, Transporte, Entretenimiento, Salud, Educacion, Hogar, Ropa, Otros
Income: Salario, Freelance, Inversiones, Otros
```

---

## 4. TypeScript Types

All types live in `src/types/`.

### `src/types/database.ts`

```typescript
export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense';
export type BudgetPeriod = 'weekly' | 'monthly';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  created_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
  created_at: string;
}
```

### `src/types/api.ts`

```typescript
export interface CreateTransactionParams {
  category_id: string;
  amount: number;
  type: TransactionType;
  description?: string;
  date: string;
}

export interface UpdateTransactionParams extends Partial<CreateTransactionParams> {}

export interface CreateCategoryParams {
  name: string;
  icon?: string;
  color?: string;
  type: CategoryType;
}

export interface TransactionFilters {
  type?: TransactionType;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface ReportData {
  total_income: number;
  total_expense: number;
  balance: number;
  by_category: { category: Category; total: number }[];
  by_date: { date: string; income: number; expense: number }[];
}
```

### `src/types/store.ts`

```typescript
export interface AuthState {
  user: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export interface TransactionState {
  transactions: TransactionWithCategory[];
  loading: boolean;
  filters: TransactionFilters;
  fetchTransactions: () => Promise<void>;
  addTransaction: (params: CreateTransactionParams) => Promise<void>;
  updateTransaction: (id: string, params: UpdateTransactionParams) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setFilters: (filters: TransactionFilters) => void;
}

export interface CategoryState {
  categories: Category[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (params: CreateCategoryParams) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}
```

---

## 5. Component Hierarchy

```
<App>
  <AuthProvider>
    <Router>
      <!-- Public routes -->
      <AuthLayout>
        <LoginPage />
        <RegisterPage />
      </AuthLayout>

      <!-- Protected routes -->
      <MainLayout>
        <Navbar />             <!-- top bar: logo, user menu, theme toggle -->
        <Sidebar />            <!-- nav links, collapsible on mobile -->
        <main>
          <Outlet />           <!-- page content -->
        </main>
      </MainLayout>
        <DashboardPage />
        <TransactionListPage />
        <TransactionFormPage />   <!-- new + edit -->
        <ReportsPage />
        <SettingsPage />
    </Router>
  </AuthProvider>
</App>
```

### Reusable UI Components (`src/components/ui/`)

| Component | Props | Description |
|---|---|---|
| `Button` | variant, size, loading, disabled, onClick | Primary action button |
| `Input` | label, error, type, placeholder | Form text input |
| `Select` | label, options, value, onChange | Dropdown select |
| `Modal` | open, onClose, title, children | Dialog overlay |
| `Card` | title, children, className | Content container |
| `Badge` | label, color | Status/category badge |
| `Spinner` | size | Loading indicator |
| `EmptyState` | icon, title, description, action | No-data placeholder |

### Feature Components

| Path | Component | Description |
|---|---|---|
| `components/auth/` | `LoginForm`, `RegisterForm` | Auth forms with validation |
| `components/layout/` | `Navbar`, `Sidebar`, `MainLayout`, `AuthLayout` | App shell |
| `components/dashboard/` | `SummaryCards`, `RecentTransactions`, `SpendingChart` | Dashboard widgets |
| `components/transactions/` | `TransactionList`, `TransactionItem`, `TransactionForm`, `FilterBar` | CRUD UI |
| `components/reports/` | `PieChart`, `BarChart`, `DateRangePicker`, `CategoryBreakdown` | Report visualizations |

---

## 6. Zustand Stores

All stores in `src/stores/`.

### `authStore.ts`

```typescript
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { AuthState } from '@/types/store';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      set({ user: profile, session, loading: false });
    } else {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .single();
    set({ user: profile, session: data.session });
  },

  signUp: async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));
```

### `transactionStore.ts`

Manages transactions list, CRUD operations, and filters. Calls `transactionService` internally.

### `categoryStore.ts`

Manages categories list and CRUD. Fetched on app init after auth.

### `uiStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist<UIState>(
    (set) => ({
      theme: 'light',
      sidebarOpen: false,
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'gastobot-ui' }
  )
);
```

---

## 7. Routes

| Path | Page Component | Auth Required | Description |
|---|---|---|---|
| `/login` | `LoginPage` | No | Sign in |
| `/register` | `RegisterPage` | No | Sign up |
| `/` | redirect to `/dashboard` | Yes | - |
| `/dashboard` | `DashboardPage` | Yes | Summary cards, recent transactions, charts |
| `/transactions` | `TransactionListPage` | Yes | Filterable transaction list |
| `/transactions/new` | `TransactionFormPage` | Yes | Add new transaction |
| `/transactions/:id/edit` | `TransactionFormPage` | Yes | Edit existing transaction |
| `/reports` | `ReportsPage` | Yes | Charts and category breakdowns |
| `/settings` | `SettingsPage` | Yes | Profile, currency, categories |

### Route Protection

Use a `<ProtectedRoute>` wrapper that checks `useAuthStore` for a valid session and redirects to `/login` if unauthenticated.

```typescript
// src/components/auth/ProtectedRoute.tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuthStore();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

---

## 8. API / Service Layer

All service files in `src/services/`. Each service wraps Supabase client calls and returns typed data.

### `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### `src/services/authService.ts`

- `signIn(email, password)` - Email/password login
- `signUp(email, password, fullName)` - Registration
- `signOut()` - Logout
- `getSession()` - Current session
- `getProfile(userId)` - Fetch profile
- `updateProfile(userId, data)` - Update profile

### `src/services/transactionService.ts`

- `getTransactions(filters?: TransactionFilters)` - List with optional filters, joined with categories
- `getTransaction(id)` - Single transaction
- `createTransaction(params: CreateTransactionParams)` - Insert
- `updateTransaction(id, params: UpdateTransactionParams)` - Update
- `deleteTransaction(id)` - Delete

Example implementation:

```typescript
export async function getTransactions(filters?: TransactionFilters) {
  let query = supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .order('date', { ascending: false });

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.category_id) query = query.eq('category_id', filters.category_id);
  if (filters?.date_from) query = query.gte('date', filters.date_from);
  if (filters?.date_to) query = query.lte('date', filters.date_to);
  if (filters?.search) query = query.ilike('description', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data as TransactionWithCategory[];
}
```

### `src/services/categoryService.ts`

- `getCategories()` - All user categories
- `createCategory(params)` - Insert
- `deleteCategory(id)` - Delete
- `seedDefaultCategories(userId)` - Create defaults on signup

### `src/services/reportService.ts`

- `getReport(dateFrom, dateTo)` - Aggregated report data
- `getSpendingByCategory(dateFrom, dateTo)` - Category totals
- `getSpendingOverTime(dateFrom, dateTo, groupBy: 'day' | 'week' | 'month')` - Time series

---

## 9. Project Folder Structure

```
gastobot/
  public/
    manifest.json
    icons/
  src/
    components/
      ui/
        Button.tsx
        Input.tsx
        Select.tsx
        Modal.tsx
        Card.tsx
        Badge.tsx
        Spinner.tsx
        EmptyState.tsx
      layout/
        MainLayout.tsx
        AuthLayout.tsx
        Navbar.tsx
        Sidebar.tsx
      auth/
        LoginForm.tsx
        RegisterForm.tsx
        ProtectedRoute.tsx
      dashboard/
        SummaryCards.tsx
        RecentTransactions.tsx
        SpendingChart.tsx
      transactions/
        TransactionList.tsx
        TransactionItem.tsx
        TransactionForm.tsx
        FilterBar.tsx
      reports/
        PieChart.tsx
        BarChart.tsx
        DateRangePicker.tsx
        CategoryBreakdown.tsx
    pages/
      LoginPage.tsx
      RegisterPage.tsx
      DashboardPage.tsx
      TransactionListPage.tsx
      TransactionFormPage.tsx
      ReportsPage.tsx
      SettingsPage.tsx
    stores/
      authStore.ts
      transactionStore.ts
      categoryStore.ts
      uiStore.ts
    services/
      authService.ts
      transactionService.ts
      categoryService.ts
      reportService.ts
    hooks/
      useTransactions.ts
      useCategories.ts
      useReport.ts
    lib/
      supabase.ts
    types/
      database.ts
      api.ts
      store.ts
    utils/
      formatCurrency.ts
      formatDate.ts
      cn.ts               # clsx + tailwind-merge helper
    App.tsx
    main.tsx
    index.css
  supabase/
    migrations/
      001_create_profiles.sql
      002_create_categories.sql
      003_create_transactions.sql
      004_create_budgets.sql
      005_rls_policies.sql
      006_triggers.sql
      007_seed_categories.sql
  .env.local               # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
```

---

## 10. v1 vs v2 Module Split

### v1 - Core (MVP)

| Module | Scope |
|---|---|
| **Auth** | Email/password login, registration, session persistence, protected routes |
| **Dashboard** | Balance summary (income, expense, net), recent 5 transactions, spending pie chart (current month) |
| **Transactions** | Full CRUD, category assignment, date picker, filter by type/category/date range, search |
| **Reports** | Pie chart by category, bar chart over time (daily/weekly/monthly), date range selector |
| **Categories** | View/create/delete categories, default set seeded on signup |

### v2 - Extended

| Module | Scope | Estado |
|---|---|---|
| **Shared Expenses - Dividir** | Compartir transacción con otros usuarios por %. Compartir al crear o después. Owner siempre incluido con % auto-calculado. Transacción se guarda con la porción del owner. | Completo |
| **Shared Expenses - Vaquitas** | Grupos temporales, gastos compartidos, liquidación | UI lista |
| **Budgets** | Set monthly/weekly budgets per category, progress bars, alerts at 80%/100% | Schema lista |
| **Multi-currency** | Currency selector per transaction, exchange rate API, base currency conversion | Pendiente |
| **Settings Advanced** | Export CSV, recurring transactions, notification preferences | Pendiente |

### Shared Expenses - Decisiones Arquitectónicas

**IMPORTANTE:** Todas las operaciones cross-table usan funciones `SECURITY DEFINER` en vez de políticas RLS cruzadas. Ver `DEVLOG.md` para el detalle del problema de recursión circular.

RPCs disponibles:
- `create_shared_transaction(p_transaction_id, p_split_method, p_total_amount, p_note, p_participants JSONB)`
- `get_pending_shared_expenses()` → retorna gastos pendientes para el usuario actual
- `get_my_shared_expenses()` → retorna gastos que el usuario compartió con otros
- `respond_to_shared_expense(p_participant_id, p_status)` → acepta/rechaza y crea transacción espejo con categoría equivalente del usuario

Los tipos de estas funciones están definidos manualmente en `src/lib/database.types.ts` (sección Functions).

Flujo de compartir al crear (`TransactionForm.tsx`):
1. Toggle "Compartir este gasto" (solo gastos nuevos, no edición)
2. Buscar amigos → definir % para cada uno → % del owner = 100% - suma amigos
3. Transacción se guarda con monto = porción del owner (no el total)
4. Se crea shared_transaction con total_amount = monto original ingresado
5. Owner se auto-acepta, amigos quedan en "pending"

Componentes UI null-safe: todos los charts y listas usan optional chaining (`category?.name`) y filtran categorías null para evitar crashes por transacciones con categorías de otros usuarios.

---

## 11. Key Conventions

- **File naming**: PascalCase for components (`Button.tsx`), camelCase for everything else (`authStore.ts`)
- **Imports**: Use `@/` path alias mapped to `src/` in `tsconfig.json`
- **Error handling**: Services throw errors; stores catch and surface via state; pages show toast notifications
- **Styling**: Tailwind utility classes. Use `cn()` helper for conditional classes. No CSS modules.
- **Environment variables**: Prefixed with `VITE_`. Never commit `.env.local`.
