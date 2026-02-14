-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only view/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Categories: full CRUD on own categories
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

-- Transactions: full CRUD on own transactions
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

-- Budgets: full CRUD on own budgets
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
