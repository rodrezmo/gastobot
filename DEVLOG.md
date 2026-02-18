# GastoBot - Development Log

> Registro de avances, decisiones y bugs resueltos. Base de contexto para futuras sesiones con agentes.

---

## Estado Actual (Febrero 2025)

### Deployment
- **URL Producción**: https://gastobot.vercel.app
- **Hosting**: Vercel (proyecto: `rodrigos-projects-a42d87da/gastobot`)
- **Backend**: Supabase (`cggnuvdsqbqxqsoqfwps.supabase.co`)
- **Analytics**: Vercel Analytics habilitado (`@vercel/analytics` + `inject()` en `main.tsx`)

### Módulos Implementados

| Módulo | Estado | Versión |
|---|---|---|
| Auth (login/registro/verificación email) | Completo | v1 |
| Dashboard (resumen, gráficos, recientes) | Completo | v1 |
| Transacciones (CRUD, filtros, categorías) | Completo | v1 |
| Reportes (pie chart, breakdown, tendencia) | Completo | v1 |
| Compartidos - Dividir gasto | Completo | v2 |
| Compartidos - Vaquitas (grupos) | UI lista, pendiente testing | v2 |
| Presupuestos | Schema lista, UI diferida | v2 |
| Multi-moneda | Pendiente | v2 |
| Settings/Perfil | Pendiente | v2 |

---

## Arquitectura de Shared Expenses (Lecciones Críticas)

### Problema: RLS Circular entre tablas

Las tablas `shared_transactions` y `shared_transaction_participants` tenían políticas RLS que se referenciaban mutuamente, causando `infinite recursion detected in policy` (error 42P17).

**Ejemplo del problema:**
```
shared_transactions SELECT policy → subquery a shared_transaction_participants
shared_transaction_participants SELECT policy → subquery a shared_transactions
→ RECURSIÓN INFINITA
```

**Impacto:** Este patrón también rompió la tabla `transactions` cuando agregamos una policy de SELECT que referenciaba las tablas compartidas. Los usuarios no podían ver ni guardar transacciones.

### Solución: SECURITY DEFINER Functions

Todas las operaciones cross-table de shared expenses usan funciones `SECURITY DEFINER` que bypasean RLS:

| Función RPC | Propósito |
|---|---|
| `create_shared_transaction()` | User A comparte un gasto (inserta en shared_transactions + participants). Owner se auto-acepta. |
| `get_pending_shared_expenses()` | User B ve gastos pendientes de aceptar (lee cross-table) |
| `get_my_shared_expenses()` | User A ve sus gastos compartidos con detalle de participantes |
| `respond_to_shared_expense()` | User B acepta/rechaza. Al aceptar, crea transacción espejo con categoría equivalente del usuario. |
| `search_users_by_email()` | Buscar usuarios para compartir |

### Problema: Categorías cross-usuario

Cuando User B acepta un gasto compartido, se le crea una transacción automática. El trigger original copiaba el `category_id` de User A, pero User B no puede ver categorías de otro usuario (RLS en `categories`), causando `Cannot read properties of null (reading 'name')`.

**Solución:** La función `respond_to_shared_expense()` busca una categoría equivalente del usuario destino (por nombre y tipo). Si no existe, usa la primera categoría del mismo tipo como fallback. Cast via `::TEXT` porque `transaction_type` y `category_type` son enums distintos.

### Regla de Oro para RLS en GastoBot

> **NUNCA crear políticas RLS que hagan subqueries a tablas que a su vez tienen políticas referenciando la tabla original.** Si necesitás acceso cross-table, usar funciones `SECURITY DEFINER`.

---

## Políticas RLS Actuales (transactions)

Solo las 4 originales - simples, sin dependencias cruzadas:

```sql
"Users can view own transactions"   → SELECT  → user_id = auth.uid()
"Users can insert own transactions" → INSERT  → user_id = auth.uid()
"Users can update own transactions" → UPDATE  → user_id = auth.uid()
"Users can delete own transactions" → DELETE  → user_id = auth.uid()
```

Las políticas circulares eliminadas:
- ~~"Participants can view shared original transactions"~~ (en transactions)
- ~~"Participants can view shared transactions"~~ (en shared_transactions)
- ~~"Owner can view all participants of their shared transactions"~~ (en shared_transaction_participants)

---

## Migraciones SQL

| # | Archivo | Descripción |
|---|---|---|
| 001 | `create_profiles.sql` | Tabla profiles + trigger auto-create en signup |
| 002 | `create_categories.sql` | Tabla categories + seed de categorías default |
| 003 | `create_transactions.sql` | Tabla transactions |
| 004 | `create_budgets.sql` | Tabla budgets |
| 005 | `rls_policies.sql` | RLS para profiles, categories, transactions, budgets |
| 006 | `indexes.sql` | Índices de performance |
| 007 | `functions.sql` | RPCs: monthly_summary, category_breakdown, monthly_trend, balance |
| 008 | `shared_expenses.sql` | 6 tablas compartidas, enums, RLS, search_users_by_email |
| 009 | `shared_expenses_rpcs.sql` | RPCs SECURITY DEFINER: create/get/respond shared expenses. Elimina trigger y políticas circulares. |

*La migración 009 fue ejecutada en SQL Editor en múltiples pasos y consolidada como archivo en el repo.*

---

## Bugs Resueltos

### 1. Failed to fetch en signup
- **Causa:** `.env.local` con placeholders sobreescribía `.env` (Vite da prioridad a .env.local)
- **Fix:** Poner las keys reales en `.env.local`

### 2. Email verification redirige a localhost
- **Causa:** Supabase Site URL default era `http://localhost:3000`
- **Fix:** Cambiar Site URL a `https://gastobot.vercel.app` en Supabase Dashboard > Auth > URL Configuration

### 3. Login no redirige al dashboard
- **Causa:** `LoginForm` llamaba `signIn()` sin navegar después
- **Fix:** Agregar `navigate('/dashboard')` post-login + redirect en `AuthLayout` si ya hay sesión

### 4. Registro sin feedback de verificación
- **Causa:** Redirigía a `/login` sin avisar que hay que verificar email
- **Fix:** Mostrar estado de éxito con mensaje "Cuenta creada - verificá tu email"

### 5. 404 al refrescar en rutas SPA
- **Causa:** Vercel no sabía que es una SPA y devolvía 404 en rutas como `/shared`
- **Fix:** `vercel.json` con rewrite `"/(.*)" → "/index.html"`

### 6. Transacciones desaparecen y no se pueden guardar
- **Causa:** Política RLS circular entre transactions ↔ shared_transactions ↔ shared_transaction_participants
- **Fix:** Eliminar políticas circulares, usar RPCs SECURITY DEFINER

### 7. Infinite recursion al aceptar/rechazar compartido
- **Causa:** Misma recursión circular, ahora disparada por UPDATE
- **Fix:** Mover toda la lógica a `respond_to_shared_expense()` SECURITY DEFINER

### 8. App crashea al aceptar gasto compartido (null category)
- **Causa:** Trigger creaba transacción con category_id de otro usuario, invisible por RLS
- **Fix:** Función busca categoría equivalente del usuario destino + UI maneja `category` null con optional chaining

### 9. Dashboard crashea por null category en charts
- **Causa:** `SpendingChart`, `ReportPieChart` y `CategoryBreakdown` no manejaban `category` null
- **Fix:** Agregar `.filter((d) => d.category != null)` antes del `.map()` en todos los charts

### 10. Gasto compartido muestra monto total en dashboard del owner
- **Causa:** La transacción se creaba con el monto completo ($1000) y después se compartía, pero el dashboard mostraba los $1000 en vez de la porción del owner
- **Fix:** Al crear+compartir en un solo paso, la transacción se guarda con el monto del owner (ej: 50% = $500). El `shared_transaction.total_amount` registra el total original ($1000) y User B recibe su porción al aceptar.

---

## Flujo de Compartir (versión final)

### Compartir al crear (TransactionForm)
1. User A crea un gasto con "Compartir este gasto" activado
2. Agrega amigos y define % para cada uno (su % se calcula automático como el resto)
3. La transacción se guarda con **la porción del owner** (no el total)
4. Se crea `shared_transaction` con el total original + participantes
5. Owner se auto-acepta, amigos quedan en "pending"

### Compartir después de crear (ShareTransactionModal)
1. User A abre un gasto existente → botón "Compartir"
2. Busca amigos, define % (su parte es automática)
3. Se crea `shared_transaction` referenciando la transacción existente
4. **Nota:** La transacción ya existe con el monto completo - no se modifica

### User B acepta
1. User B ve notificación en sección "Compartidos"
2. Al aceptar, `respond_to_shared_expense()` crea una transacción espejo con:
   - Categoría equivalente del usuario (busca por nombre+tipo, fallback a primera del mismo tipo)
   - Monto = su porción del split
   - Descripción original + " (compartido)"

---

## Stack Actual

| Layer | Versión |
|---|---|
| React | 19 |
| Vite | 7 |
| TypeScript | strict mode |
| Tailwind CSS | 4 |
| Zustand | latest |
| Recharts | latest |
| React Router | v7 |
| Lucide React | latest |
| Supabase JS | latest |
| Vercel Analytics | @vercel/analytics |

---

## Archivos Clave

```
src/
├── lib/
│   ├── supabase.ts              # Cliente Supabase tipado
│   └── database.types.ts        # Tipos generados + RPCs manuales
├── services/
│   ├── transactionService.ts    # CRUD transacciones
│   ├── sharedService.ts         # RPCs compartidos (SECURITY DEFINER)
│   └── groupService.ts          # CRUD vaquitas/grupos
├── stores/
│   ├── authStore.ts             # Auth state + session
│   ├── transactionStore.ts      # Transacciones
│   ├── sharedStore.ts           # Compartidos (lazy imports)
│   └── groupStore.ts            # Grupos
├── pages/
│   ├── DashboardPage.tsx        # Panel principal
│   ├── TransactionsPage.tsx     # Lista + filtros
│   ├── SharedPage.tsx           # Compartidos + Vaquitas (tabs)
│   ├── GroupDetailPage.tsx      # Detalle de vaquita
│   └── CreateGroupPage.tsx      # Nueva vaquita
├── components/
│   ├── shared/                  # Componentes de gastos compartidos
│   └── groups/                  # Componentes de vaquitas
└── types/
    ├── database.ts              # Tipos de entidades
    └── shared.ts                # Tipos de compartidos/grupos
```

---

## Convenciones (ver CLAUDE.md)

- UI en español (es-AR), moneda default ARS
- PascalCase para componentes, camelCase para el resto
- Imports con `@/` alias → `src/`
- Tailwind only, `cn()` para clases condicionales
- Zustand stores como single source of truth
- Services lanzan errores, stores los capturan

---

## Pendientes / Próximos Pasos

- [ ] Testing completo del flujo de vaquitas (grupos)
- [ ] Notificaciones en tiempo real (Supabase Realtime)
- [ ] Presupuestos UI (schema ya existe)
- [ ] Settings/Perfil de usuario
- [ ] Multi-moneda
- [x] ~~Guardar migración 009 como archivo SQL~~ (consolidada en `009_shared_expenses_rpcs.sql`)
- [ ] Crear ROADMAP.md con plan de features
- [ ] Code-splitting para reducir bundle size (~878KB)
- [ ] Compartir después de crear: ajustar monto del owner en la transacción existente (hoy queda el total original)
