# GastoBot - Shared Expenses Module (Gastos Compartidos)

> Modulo v2: Dividir gastos individuales y crear vaquitas grupales

---

## 1. Overview

The Shared Expenses module adds two main flows to GastoBot:

1. **Dividir Gasto (Split Transaction)** - Share an existing transaction with other GastoBot users, splitting the cost by equal parts, custom amounts, or percentages.
2. **La Vaquita (Group Pot)** - Create a temporary group where members log shared expenses, track balances in real-time, and settle debts with minimum transfers.

---

## 2. Database Schema

### 2.1 New Enums

```sql
CREATE TYPE split_method AS ENUM ('equal', 'custom', 'percentage');
CREATE TYPE participant_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE group_status AS ENUM ('active', 'settled', 'archived');
CREATE TYPE group_role AS ENUM ('admin', 'member');
CREATE TYPE settlement_status AS ENUM ('pending', 'confirmed');
```

### 2.2 New Tables

#### `shared_transactions`

Links an existing transaction to a sharing event. The `owner_id` is the person who paid and initiates the split.

```sql
CREATE TABLE public.shared_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  split_method split_method NOT NULL DEFAULT 'equal',
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shared_transactions_owner ON public.shared_transactions(owner_id);
CREATE INDEX idx_shared_transactions_tx ON public.shared_transactions(transaction_id);
```

#### `shared_transaction_participants`

Each participant's share in a split transaction. Includes the owner themselves (so all shares sum to total_amount).

```sql
CREATE TABLE public.shared_transaction_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_transaction_id UUID NOT NULL REFERENCES public.shared_transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  percentage NUMERIC(5, 2) CHECK (percentage >= 0 AND percentage <= 100),
  status participant_status NOT NULL DEFAULT 'pending',
  created_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (shared_transaction_id, user_id)
);

CREATE INDEX idx_stp_shared_tx ON public.shared_transaction_participants(shared_transaction_id);
CREATE INDEX idx_stp_user ON public.shared_transaction_participants(user_id);
CREATE INDEX idx_stp_status ON public.shared_transaction_participants(user_id, status);
```

**Notes:**
- `created_transaction_id`: When a participant accepts, a new transaction is auto-created in their account. This FK links to it.
- The owner's row has `status = 'accepted'` by default (they initiated the split).
- `percentage` is only populated when `split_method = 'percentage'`.

#### `groups`

A "vaquita" - a temporary group for shared spending.

```sql
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status group_status NOT NULL DEFAULT 'active',
  currency TEXT NOT NULL DEFAULT 'ARS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_groups_creator ON public.groups(creator_id);
CREATE INDEX idx_groups_status ON public.groups(status);
```

#### `group_members`

Members of a group. The creator is automatically added as `admin`.

```sql
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role group_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
```

#### `group_expenses`

Individual expenses logged within a group. `paid_by` is the member who paid.

```sql
CREATE TABLE public.group_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_group_expenses_group ON public.group_expenses(group_id);
CREATE INDEX idx_group_expenses_paid_by ON public.group_expenses(paid_by);
```

#### `settlements`

Records of debt settlements between two users. Can originate from split transactions or group settlements.

```sql
CREATE TABLE public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  shared_transaction_id UUID REFERENCES public.shared_transactions(id) ON DELETE SET NULL,
  status settlement_status NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,

  CHECK (from_user_id != to_user_id)
);

CREATE INDEX idx_settlements_from ON public.settlements(from_user_id);
CREATE INDEX idx_settlements_to ON public.settlements(to_user_id);
CREATE INDEX idx_settlements_group ON public.settlements(group_id);
CREATE INDEX idx_settlements_status ON public.settlements(status);
```

### 2.3 Row-Level Security (RLS)

All new tables have RLS enabled. Policies allow users to see/modify only data they participate in.

```sql
-- shared_transactions
ALTER TABLE public.shared_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage shared transactions"
  ON public.shared_transactions FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Participants can view shared transactions"
  ON public.shared_transactions FOR SELECT
  USING (
    id IN (
      SELECT shared_transaction_id FROM public.shared_transaction_participants
      WHERE user_id = auth.uid()
    )
  );

-- shared_transaction_participants
ALTER TABLE public.shared_transaction_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own participations"
  ON public.shared_transaction_participants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owner can view all participants of their shared transactions"
  ON public.shared_transaction_participants FOR SELECT
  USING (
    shared_transaction_id IN (
      SELECT id FROM public.shared_transactions WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert participants"
  ON public.shared_transaction_participants FOR INSERT
  WITH CHECK (
    shared_transaction_id IN (
      SELECT id FROM public.shared_transactions WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update own status"
  ON public.shared_transaction_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view their groups"
  ON public.groups FOR SELECT
  USING (
    id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Creator can manage group"
  ON public.groups FOR ALL
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM public.group_members gm WHERE gm.user_id = auth.uid())
  );

CREATE POLICY "Admin can manage members"
  ON public.group_members FOR ALL
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- group_expenses
ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group expenses"
  ON public.group_expenses FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can insert expenses"
  ON public.group_expenses FOR INSERT
  WITH CHECK (
    paid_by = auth.uid()
    AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Payer can update/delete own expenses"
  ON public.group_expenses FOR UPDATE
  USING (paid_by = auth.uid())
  WITH CHECK (paid_by = auth.uid());

CREATE POLICY "Payer can delete own expenses"
  ON public.group_expenses FOR DELETE
  USING (paid_by = auth.uid());

-- settlements
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Involved users can view settlements"
  ON public.settlements FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Debtor can create settlement"
  ON public.settlements FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Creditor can confirm settlement"
  ON public.settlements FOR UPDATE
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());
```

### 2.4 Profile Search Policy (addition to existing table)

To support searching users by email for sharing, add a limited SELECT policy on profiles:

```sql
CREATE POLICY "Users can search profiles by email"
  ON public.profiles FOR SELECT
  USING (true);
```

> Note: This allows any authenticated user to read profile rows. Since profiles only contain `id`, `email`, `full_name`, `avatar_url`, `currency`, and `created_at`, this is acceptable. Alternatively, use a Supabase Edge Function or RPC to search by email and return only `id`, `email`, `full_name`, `avatar_url`.

**Recommended approach: RPC function for profile search**

```sql
CREATE OR REPLACE FUNCTION public.search_users_by_email(search_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.email ILIKE '%' || search_email || '%'
  AND p.id != auth.uid()
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.5 Database Functions

#### Auto-create transaction on acceptance

```sql
CREATE OR REPLACE FUNCTION public.handle_shared_expense_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_shared shared_transactions%ROWTYPE;
  v_original transactions%ROWTYPE;
  v_new_tx_id UUID;
BEGIN
  -- Only fire when status changes to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    SELECT * INTO v_shared FROM public.shared_transactions WHERE id = NEW.shared_transaction_id;
    SELECT * INTO v_original FROM public.transactions WHERE id = v_shared.transaction_id;

    INSERT INTO public.transactions (user_id, category_id, amount, type, description, date)
    VALUES (
      NEW.user_id,
      v_original.category_id,
      NEW.amount,
      v_original.type,
      COALESCE(v_original.description, '') || ' (compartido)',
      v_original.date
    )
    RETURNING id INTO v_new_tx_id;

    NEW.created_transaction_id := v_new_tx_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_shared_expense_accepted
  BEFORE UPDATE ON public.shared_transaction_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_shared_expense_accepted();
```

### 2.6 Migration File

All the above SQL goes into:
```
supabase/migrations/008_shared_expenses.sql
```

---

## 3. Settlement Algorithm

The settlement algorithm minimizes the number of transfers needed to settle all debts within a group.

### Net Balance Approach

```
1. For each member, compute:
   net_balance = total_paid - fair_share
   where fair_share = group_total / num_members

2. Separate members into:
   - creditors (net_balance > 0): they paid more than their share
   - debtors (net_balance < 0): they paid less than their share

3. Sort creditors descending, debtors ascending (by absolute value)

4. Greedy matching:
   while creditors and debtors remain:
     take top creditor and top debtor
     transfer = min(creditor.balance, |debtor.balance|)
     record: debtor pays creditor `transfer`
     reduce both balances
     remove anyone whose balance reaches 0
```

### Example

A paid $30,000, B paid $10,000, C paid $0. Total = $40,000, fair share = $13,333.33.

| Member | Paid    | Fair Share | Net Balance  |
|--------|---------|------------|-------------|
| A      | 30,000  | 13,333.33  | +16,666.67  |
| B      | 10,000  | 13,333.33  |  -3,333.33  |
| C      |      0  | 13,333.33  | -13,333.33  |

Settlements:
1. C pays A $13,333.33
2. B pays A $3,333.33

Result: 2 transfers (minimum possible).

### TypeScript Implementation

```typescript
interface MemberBalance {
  userId: string;
  paid: number;
  fairShare: number;
  netBalance: number;
}

interface SettlementTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

function calculateSettlements(
  expenses: { paidBy: string; amount: number }[],
  memberIds: string[]
): SettlementTransfer[] {
  const totalPaid = new Map<string, number>();
  let grandTotal = 0;

  for (const id of memberIds) {
    totalPaid.set(id, 0);
  }

  for (const exp of expenses) {
    totalPaid.set(exp.paidBy, (totalPaid.get(exp.paidBy) || 0) + exp.amount);
    grandTotal += exp.amount;
  }

  const fairShare = grandTotal / memberIds.length;

  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, paid] of totalPaid) {
    const net = paid - fairShare;
    if (net > 0.01) {
      creditors.push({ userId, amount: net });
    } else if (net < -0.01) {
      debtors.push({ userId, amount: -net });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const transfer = Math.min(creditors[ci].amount, debtors[di].amount);
    transfers.push({
      fromUserId: debtors[di].userId,
      toUserId: creditors[ci].userId,
      amount: Math.round(transfer * 100) / 100,
    });

    creditors[ci].amount -= transfer;
    debtors[di].amount -= transfer;

    if (creditors[ci].amount < 0.01) ci++;
    if (debtors[di].amount < 0.01) di++;
  }

  return transfers;
}
```

---

## 4. TypeScript Types

### `src/types/shared.ts`

```typescript
// ---- Enums ----
export type SplitMethod = 'equal' | 'custom' | 'percentage';
export type ParticipantStatus = 'pending' | 'accepted' | 'rejected';
export type GroupStatus = 'active' | 'settled' | 'archived';
export type GroupRole = 'admin' | 'member';
export type SettlementStatus = 'pending' | 'confirmed';

// ---- Flow 1: Split Transaction ----
export interface SharedTransaction {
  id: string;
  transaction_id: string;
  owner_id: string;
  split_method: SplitMethod;
  total_amount: number;
  note: string | null;
  created_at: string;
}

export interface SharedTransactionParticipant {
  id: string;
  shared_transaction_id: string;
  user_id: string;
  amount: number;
  percentage: number | null;
  status: ParticipantStatus;
  created_transaction_id: string | null;
  responded_at: string | null;
  created_at: string;
}

export interface SharedTransactionWithDetails extends SharedTransaction {
  transaction: Transaction;
  owner: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>;
  participants: (SharedTransactionParticipant & {
    user: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>;
  })[];
}

// ---- Flow 2: La Vaquita (Groups) ----
export interface Group {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  status: GroupStatus;
  currency: string;
  created_at: string;
  settled_at: string | null;
  archived_at: string | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
}

export interface GroupExpense {
  id: string;
  group_id: string;
  paid_by: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

export interface Settlement {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  group_id: string | null;
  shared_transaction_id: string | null;
  status: SettlementStatus;
  note: string | null;
  created_at: string;
  confirmed_at: string | null;
}

// ---- Composed types for UI ----
export interface GroupWithMembers extends Group {
  members: (GroupMember & {
    user: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>;
  })[];
}

export interface GroupExpenseWithPayer extends GroupExpense {
  payer: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>;
}

export interface GroupDetail extends GroupWithMembers {
  expenses: GroupExpenseWithPayer[];
  total: number;
  settlements: SettlementWithUsers[];
}

export interface SettlementWithUsers extends Settlement {
  from_user: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>;
  to_user: Pick<Profile, 'id' | 'email' | 'full_name' | 'avatar_url'>;
}

export interface SettlementTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface MemberBalance {
  userId: string;
  userName: string;
  paid: number;
  fairShare: number;
  netBalance: number;
}

export interface UserBalance {
  userId: string;
  userName: string;
  amount: number;
  direction: 'owes_you' | 'you_owe';
}

// ---- API Params ----
export interface CreateSharedTransactionParams {
  transaction_id: string;
  split_method: SplitMethod;
  participants: {
    user_id: string;
    amount: number;
    percentage?: number;
  }[];
  note?: string;
}

export interface RespondToSharedExpenseParams {
  participant_id: string;
  status: 'accepted' | 'rejected';
}

export interface CreateGroupParams {
  name: string;
  description?: string;
  member_emails: string[];
}

export interface AddGroupExpenseParams {
  group_id: string;
  amount: number;
  description: string;
  date: string;
}

export interface CreateSettlementParams {
  to_user_id: string;
  amount: number;
  group_id?: string;
  shared_transaction_id?: string;
  note?: string;
}

export interface UserSearchResult {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}
```

---

## 5. Zustand Stores

### `src/stores/sharedStore.ts`

```typescript
import { create } from 'zustand';

interface SharedState {
  // Pending shared expenses where I am a participant
  pendingSharedExpenses: SharedTransactionWithDetails[];
  // Shared expenses I created
  mySharedExpenses: SharedTransactionWithDetails[];
  // Global balances with other users
  balances: UserBalance[];
  loading: boolean;

  fetchPendingSharedExpenses: () => Promise<void>;
  fetchMySharedExpenses: () => Promise<void>;
  fetchBalances: () => Promise<void>;
  createSharedTransaction: (params: CreateSharedTransactionParams) => Promise<void>;
  respondToSharedExpense: (params: RespondToSharedExpenseParams) => Promise<void>;
}
```

### `src/stores/groupStore.ts`

```typescript
import { create } from 'zustand';

interface GroupState {
  groups: GroupWithMembers[];
  currentGroup: GroupDetail | null;
  settlements: SettlementTransfer[];
  loading: boolean;

  fetchGroups: () => Promise<void>;
  fetchGroupDetail: (groupId: string) => Promise<void>;
  createGroup: (params: CreateGroupParams) => Promise<void>;
  addExpense: (params: AddGroupExpenseParams) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  calculateSettlements: (groupId: string) => SettlementTransfer[];
  createSettlement: (params: CreateSettlementParams) => Promise<void>;
  confirmSettlement: (settlementId: string) => Promise<void>;
  settleGroup: (groupId: string) => Promise<void>;
  archiveGroup: (groupId: string) => Promise<void>;
}
```

---

## 6. Service Layer

### `src/services/sharedService.ts`

```typescript
// All functions use the supabase client from @/lib/supabase

// ---- User Search ----
searchUsersByEmail(email: string): Promise<UserSearchResult[]>
  // Calls supabase.rpc('search_users_by_email', { search_email: email })

// ---- Shared Transactions (Flow 1) ----
createSharedTransaction(params: CreateSharedTransactionParams): Promise<SharedTransaction>
  // 1. Insert into shared_transactions
  // 2. Insert participants into shared_transaction_participants
  // 3. Owner's row gets status='accepted' automatically

getPendingSharedExpenses(): Promise<SharedTransactionWithDetails[]>
  // Select from shared_transaction_participants where user_id=auth.uid() and status='pending'
  // Join with shared_transactions, transactions, profiles

getMySharedExpenses(): Promise<SharedTransactionWithDetails[]>
  // Select from shared_transactions where owner_id=auth.uid()
  // Join with participants and profiles

respondToSharedExpense(participantId: string, status: 'accepted' | 'rejected'): Promise<void>
  // Update shared_transaction_participants set status, responded_at
  // The DB trigger handles auto-creating the transaction on acceptance

getBalances(): Promise<UserBalance[]>
  // Aggregate from shared_transaction_participants and settlements
  // Calculate net amounts between current user and each counterparty
```

### `src/services/groupService.ts`

```typescript
// ---- Groups (Flow 2) ----
createGroup(params: CreateGroupParams): Promise<Group>
  // 1. Insert into groups
  // 2. Insert creator as admin in group_members
  // 3. Search member_emails, insert as members
  // Returns created group

getGroups(): Promise<GroupWithMembers[]>
  // Select from groups via group_members where user_id=auth.uid()
  // Join with group_members -> profiles

getGroupDetail(groupId: string): Promise<GroupDetail>
  // Fetch group, members, expenses, settlements
  // Compute total from expenses

addGroupExpense(params: AddGroupExpenseParams): Promise<GroupExpense>
  // Insert into group_expenses with paid_by=auth.uid()

updateGroupExpense(expenseId: string, params: Partial<AddGroupExpenseParams>): Promise<void>
  // Update group_expenses

deleteGroupExpense(expenseId: string): Promise<void>
  // Delete from group_expenses

createSettlement(params: CreateSettlementParams): Promise<Settlement>
  // Insert into settlements with from_user_id=auth.uid()

confirmSettlement(settlementId: string): Promise<void>
  // Update settlements set status='confirmed', confirmed_at=now()

settleGroup(groupId: string): Promise<void>
  // Update groups set status='settled', settled_at=now()

archiveGroup(groupId: string): Promise<void>
  // Update groups set status='archived', archived_at=now()

getGroupSettlements(groupId: string): Promise<SettlementWithUsers[]>
  // Select from settlements where group_id, join profiles
```

---

## 7. Custom Hooks

### `src/hooks/useSharedExpenses.ts`

```typescript
export function useSharedExpenses() {
  const store = useSharedStore();

  useEffect(() => {
    store.fetchPendingSharedExpenses();
    store.fetchMySharedExpenses();
    store.fetchBalances();
  }, []);

  return {
    pending: store.pendingSharedExpenses,
    sent: store.mySharedExpenses,
    balances: store.balances,
    loading: store.loading,
    share: store.createSharedTransaction,
    respond: store.respondToSharedExpense,
  };
}
```

### `src/hooks/useGroups.ts`

```typescript
export function useGroups() {
  const store = useGroupStore();

  useEffect(() => {
    store.fetchGroups();
  }, []);

  return {
    groups: store.groups,
    loading: store.loading,
    createGroup: store.createGroup,
  };
}
```

### `src/hooks/useGroupDetail.ts`

```typescript
export function useGroupDetail(groupId: string) {
  const store = useGroupStore();

  useEffect(() => {
    store.fetchGroupDetail(groupId);
  }, [groupId]);

  return {
    group: store.currentGroup,
    loading: store.loading,
    addExpense: store.addExpense,
    deleteExpense: store.deleteExpense,
    settlements: store.settlements,
    calculateSettlements: () => store.calculateSettlements(groupId),
    createSettlement: store.createSettlement,
    confirmSettlement: store.confirmSettlement,
    settleGroup: () => store.settleGroup(groupId),
    archiveGroup: () => store.archiveGroup(groupId),
  };
}
```

### `src/hooks/useSettlement.ts`

```typescript
export function useSettlement(groupId: string) {
  const { currentGroup, calculateSettlements } = useGroupStore();

  const memberBalances: MemberBalance[] = useMemo(() => {
    if (!currentGroup) return [];
    const { expenses, members } = currentGroup;
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const fairShare = total / members.length;

    return members.map((m) => {
      const paid = expenses
        .filter((e) => e.paid_by === m.user_id)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        userId: m.user_id,
        userName: m.user.full_name || m.user.email,
        paid,
        fairShare,
        netBalance: paid - fairShare,
      };
    });
  }, [currentGroup]);

  const transfers = useMemo(() => calculateSettlements(groupId), [groupId, currentGroup]);

  return { memberBalances, transfers };
}
```

### `src/hooks/useUserSearch.ts`

```typescript
export function useUserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) { setResults([]); return; }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const users = await searchUsersByEmail(query);
      setResults(users);
      setLoading(false);
    }, 300); // debounce

    return () => clearTimeout(timeout);
  }, [query]);

  return { query, setQuery, results, loading };
}
```

---

## 8. Components

### 8.1 Component Tree

```
src/components/shared/
  ShareTransactionModal.tsx      # Modal to share an existing transaction
  SplitMethodSelector.tsx        # Choose: equal / custom / percentage
  FriendSearch.tsx               # Search users by email, select participants
  ParticipantList.tsx            # List of participants with amounts
  SharedExpenseCard.tsx          # Card for a pending/sent shared expense
  SharedNotificationList.tsx     # List of pending shared expenses to respond to
  BalanceCard.tsx                # "Le debes $X a Y" / "Z te debe $X"
  DebtList.tsx                   # Summary of all balances with other users

src/components/groups/
  GroupCard.tsx                  # Card preview of a group in the list
  GroupDetail.tsx                # Full group view (members, expenses, balances)
  GroupExpenseForm.tsx           # Form to add an expense to a group
  GroupExpenseList.tsx           # List of expenses in a group
  GroupMemberList.tsx            # List of group members with roles
  SettlementSummary.tsx         # Shows calculated settlements (who pays whom)
  SettlementItem.tsx            # Single settlement row with confirm action
  CreateGroupForm.tsx           # Form to create a new group

src/components/ui/
  NotificationBadge.tsx          # Badge showing count of pending items
```

### 8.2 Component Specifications

#### `ShareTransactionModal`

**Props:** `{ transaction: Transaction; open: boolean; onClose: () => void }`

**Behavior:**
1. Opens from TransactionItem's "Compartir" button
2. Shows transaction summary (description, amount, date, category)
3. Contains `FriendSearch` to add participants
4. Contains `SplitMethodSelector` to choose split method
5. Dynamically shows split amounts per participant
6. "Compartir gasto" button submits

**UI Labels (Spanish):**
- Title: "Compartir gasto"
- Split methods: "Partes iguales" / "Montos personalizados" / "Porcentaje"
- Button: "Compartir"
- Search placeholder: "Buscar por email..."

#### `FriendSearch`

**Props:** `{ onSelect: (user: UserSearchResult) => void; excludeIds?: string[] }`

**Behavior:**
- Text input with debounced search (300ms, min 3 chars)
- Dropdown with results showing avatar, name, email
- Click to add, excluded IDs prevent re-adding
- Uses `useUserSearch` hook

#### `SplitMethodSelector`

**Props:** `{ method: SplitMethod; onChange: (method: SplitMethod) => void; totalAmount: number; participants: UserSearchResult[]; splits: Map<string, number>; onSplitsChange: (splits: Map<string, number>) => void }`

**Behavior:**
- Three toggle buttons for split method
- `equal`: Auto-calculates amount per person (totalAmount / count), read-only
- `custom`: Editable amount input per participant, shows remaining
- `percentage`: Editable percentage input per participant, shows total %

#### `GroupCard`

**Props:** `{ group: GroupWithMembers }`

**Displays:** Group name, member count, status badge, total spent. Links to `/shared/groups/:id`.

#### `GroupDetail`

**Props:** `{ groupId: string }`

**Sections:**
- Header: Group name, description, status
- Members tab: `GroupMemberList`
- Expenses tab: `GroupExpenseList` + `GroupExpenseForm`
- Balances tab: `SettlementSummary`

#### `SettlementSummary`

**Props:** `{ groupId: string }`

**Displays:**
- Per-member balance table (paid, fair share, net balance)
- Suggested transfers list
- "Marcar como pagado" button per transfer
- If all settled, "Cerrar vaquita" button

#### `NotificationBadge`

**Props:** `{ count: number }`

**Displays:** Red circle with count on Sidebar "Compartidos" link.

---

## 9. Pages

### `src/pages/SharedPage.tsx`

**Route:** `/shared`

**Sections:**
1. **Resumen de deudas** - `DebtList` showing balances with all users
2. **Pendientes** - `SharedNotificationList` with accept/reject actions
3. **Gastos compartidos enviados** - List of `SharedExpenseCard`
4. **Mis vaquitas** - Grid of `GroupCard` + "Nueva vaquita" button

### `src/pages/CreateGroupPage.tsx`

**Route:** `/shared/groups/new`

**Content:** `CreateGroupForm` with:
- Name input
- Description textarea (optional)
- `FriendSearch` to add members
- "Crear vaquita" submit button

### `src/pages/GroupDetailPage.tsx`

**Route:** `/shared/groups/:id`

**Content:** `GroupDetail` component with tabs for expenses, members, and balances.

---

## 10. Routes (additions to App.tsx)

```typescript
// Inside protected routes in App.tsx
<Route path="/shared" element={<SharedPage />} />
<Route path="/shared/groups/new" element={<CreateGroupPage />} />
<Route path="/shared/groups/:id" element={<GroupDetailPage />} />
```

| Path | Page | Description |
|------|------|-------------|
| `/shared` | `SharedPage` | Overview: balances, pending, groups |
| `/shared/groups/new` | `CreateGroupPage` | Create a new vaquita |
| `/shared/groups/:id` | `GroupDetailPage` | View group detail |

---

## 11. Notification System

### 11.1 Supabase Realtime Subscriptions

Use Supabase Realtime to notify users of shared expense activity without polling.

**Subscribe in `sharedStore` or a top-level `useSharedNotifications` hook:**

```typescript
// src/hooks/useSharedNotifications.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useSharedStore } from '@/stores/sharedStore';

export function useSharedNotifications() {
  const { user } = useAuthStore();
  const { fetchPendingSharedExpenses, fetchBalances } = useSharedStore();

  useEffect(() => {
    if (!user) return;

    // Listen for new shared expense participations
    const participantChannel = supabase
      .channel('shared-participants')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shared_transaction_participants',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPendingSharedExpenses();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shared_transaction_participants',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPendingSharedExpenses();
          fetchBalances();
        }
      )
      .subscribe();

    // Listen for new group expenses
    const groupChannel = supabase
      .channel('group-expenses')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_expenses',
        },
        () => {
          // Refresh group detail if currently viewing one
          // Store handles this check internally
        }
      )
      .subscribe();

    // Listen for settlement updates
    const settlementChannel = supabase
      .channel('settlements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settlements',
          filter: `to_user_id=eq.${user.id}`,
        },
        () => {
          fetchBalances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantChannel);
      supabase.removeChannel(groupChannel);
      supabase.removeChannel(settlementChannel);
    };
  }, [user?.id]);
}
```

**Activate in MainLayout or App:**

```typescript
// In MainLayout.tsx or a wrapper component
function SharedNotificationsProvider({ children }: { children: React.ReactNode }) {
  useSharedNotifications();
  return <>{children}</>;
}
```

### 11.2 Pending Count for Badge

The `useSharedStore` exposes `pendingSharedExpenses.length` which drives the `NotificationBadge` on the Sidebar.

```typescript
// In Sidebar.tsx
const pendingCount = useSharedStore((s) => s.pendingSharedExpenses.length);

<NavLink to="/shared">
  Compartidos
  {pendingCount > 0 && <NotificationBadge count={pendingCount} />}
</NavLink>
```

---

## 12. Updates to Existing Components

### 12.1 `TransactionItem.tsx` (or `TransactionCard`)

Add a "Compartir" button/icon to each transaction row:

```tsx
<button onClick={() => setShareModalOpen(true)} title="Compartir gasto">
  <Share2 size={16} />
</button>

{shareModalOpen && (
  <ShareTransactionModal
    transaction={transaction}
    open={shareModalOpen}
    onClose={() => setShareModalOpen(false)}
  />
)}
```

### 12.2 `Sidebar.tsx`

Add navigation link for the shared expenses section:

```tsx
<NavLink to="/shared" className={navLinkClass}>
  <Users size={20} />
  <span>Compartidos</span>
  {pendingCount > 0 && <NotificationBadge count={pendingCount} />}
</NavLink>
```

Place it after "Reportes" in the navigation order.

### 12.3 `DashboardPage.tsx` (optional enhancement)

Add a small "Deudas pendientes" card if the user has outstanding balances:

```tsx
{balances.length > 0 && (
  <Card title="Deudas pendientes">
    <DebtList balances={balances} compact />
  </Card>
)}
```

---

## 13. File Structure (new files)

```
src/
  types/
    shared.ts                           # All shared expense types
  stores/
    sharedStore.ts                      # Zustand store for split transactions
    groupStore.ts                       # Zustand store for groups/vaquitas
  services/
    sharedService.ts                    # Supabase calls for split flow
    groupService.ts                     # Supabase calls for group flow
  hooks/
    useSharedExpenses.ts                # Hook for split transactions
    useGroups.ts                        # Hook for groups list
    useGroupDetail.ts                   # Hook for single group
    useSettlement.ts                    # Hook for settlement calculations
    useUserSearch.ts                    # Hook for user search with debounce
    useSharedNotifications.ts           # Realtime subscriptions
  components/
    shared/
      ShareTransactionModal.tsx
      SplitMethodSelector.tsx
      FriendSearch.tsx
      ParticipantList.tsx
      SharedExpenseCard.tsx
      SharedNotificationList.tsx
      BalanceCard.tsx
      DebtList.tsx
    groups/
      GroupCard.tsx
      GroupDetail.tsx
      GroupExpenseForm.tsx
      GroupExpenseList.tsx
      GroupMemberList.tsx
      SettlementSummary.tsx
      SettlementItem.tsx
      CreateGroupForm.tsx
    ui/
      NotificationBadge.tsx             # (new)
  pages/
    SharedPage.tsx
    CreateGroupPage.tsx
    GroupDetailPage.tsx
supabase/
  migrations/
    008_shared_expenses.sql             # All new tables, enums, RLS, triggers
```

---

## 14. Implementation Order

Recommended order for parallel backend/frontend work:

### Backend (database + services):
1. Migration `008_shared_expenses.sql` - all tables, enums, RLS, functions, triggers
2. `src/types/shared.ts` - all TypeScript types
3. `src/services/sharedService.ts` - split transaction CRUD
4. `src/services/groupService.ts` - group CRUD
5. Update `src/lib/database.types.ts` with new table types

### Frontend (stores + UI):
1. `src/stores/sharedStore.ts` + `src/stores/groupStore.ts`
2. All hooks
3. `src/components/ui/NotificationBadge.tsx`
4. `src/components/shared/*` (FriendSearch first, then modals)
5. `src/components/groups/*` (GroupCard first, then detail views)
6. Pages: SharedPage, CreateGroupPage, GroupDetailPage
7. Route additions in App.tsx
8. Updates to Sidebar, TransactionItem, DashboardPage
9. `src/hooks/useSharedNotifications.ts` (Realtime)

Backend and frontend can work in parallel once types are defined (step 2).
