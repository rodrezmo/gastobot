-- Add updated_at column to budgets
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add unique constraint to support upsert per (user, category)
ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_user_category_unique UNIQUE (user_id, category_id);

-- RPC: get_budget_summary
-- Returns budget vs. actual spending for the current user for a given month
CREATE OR REPLACE FUNCTION get_budget_summary(p_month DATE)
RETURNS TABLE (
  budget_id     UUID,
  category_id   UUID,
  category_name TEXT,
  category_color TEXT,
  limit_amount  NUMERIC,
  spent_amount  NUMERIC,
  percentage    NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id                                                        AS budget_id,
    b.category_id,
    c.name                                                      AS category_name,
    c.color                                                     AS category_color,
    b.amount                                                    AS limit_amount,
    COALESCE(SUM(t.amount), 0)                                  AS spent_amount,
    CASE
      WHEN b.amount > 0
        THEN ROUND((COALESCE(SUM(t.amount), 0) / b.amount * 100)::NUMERIC, 1)
      ELSE 0
    END                                                         AS percentage
  FROM budgets b
  JOIN categories c ON c.id = b.category_id
  LEFT JOIN transactions t
    ON  t.category_id = b.category_id
    AND t.user_id     = auth.uid()
    AND t.type        = 'expense'
    AND date_trunc('month', t.date::TIMESTAMP)
      = date_trunc('month', p_month::TIMESTAMP)
  WHERE b.user_id = auth.uid()
    AND b.period  = 'monthly'
  GROUP BY b.id, b.category_id, c.name, c.color, b.amount;
END;
$$;
