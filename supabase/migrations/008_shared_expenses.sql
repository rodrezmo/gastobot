-- 008_shared_expenses.sql
-- Shared Expenses Module: Split transactions + Group "vaquitas"

-- =============================================
-- 1. Enums
-- =============================================

CREATE TYPE split_method AS ENUM ('equal', 'custom', 'percentage');
CREATE TYPE participant_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE group_status AS ENUM ('active', 'settled', 'archived');
CREATE TYPE group_role AS ENUM ('admin', 'member');
CREATE TYPE settlement_status AS ENUM ('pending', 'confirmed');

-- =============================================
-- 2. Tables
-- =============================================

-- Shared Transactions (split an existing transaction)
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

-- Participants in a shared transaction
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

-- Groups (vaquitas)
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

-- Group members
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

-- Group expenses
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

-- Settlements
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

-- =============================================
-- 3. Row-Level Security
-- =============================================

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

CREATE POLICY "Payer can update own expenses"
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

-- =============================================
-- 4. Profile search RPC
-- =============================================

CREATE POLICY "Users can search profiles by email"
  ON public.profiles FOR SELECT
  USING (true);

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

-- =============================================
-- 5. Trigger: Auto-create transaction on acceptance
-- =============================================

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
