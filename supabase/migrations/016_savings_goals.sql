-- ============================================================
-- 016_savings_goals.sql
-- Tabla savings_goals + RPC get_savings_summary()
-- ============================================================

-- Tabla
CREATE TABLE savings_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  target_amount NUMERIC,
  target_date   DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice de acceso por usuario
CREATE INDEX savings_goals_user_id_idx ON savings_goals (user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_savings_goals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER savings_goals_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION update_savings_goals_updated_at();

-- RLS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savings_goals: owner only"
  ON savings_goals
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- RPC get_savings_summary()
-- ============================================================
CREATE OR REPLACE FUNCTION get_savings_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       UUID;
  v_total_saved   NUMERIC;
  v_monthly_avg   NUMERIC;
  v_goals         JSON;
BEGIN
  v_user_id := auth.uid();

  -- Total ahorrado: suma de todas las transacciones cuya categoría se llama 'Ahorro'
  SELECT COALESCE(SUM(t.amount), 0)
  INTO v_total_saved
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
  WHERE t.user_id = v_user_id
    AND LOWER(c.name) = 'ahorro';

  -- Promedio mensual de ahorro de los últimos 3 meses
  SELECT COALESCE(
    SUM(t.amount) / NULLIF(COUNT(DISTINCT TO_CHAR(t.date::DATE, 'YYYY-MM')), 0),
    0
  )
  INTO v_monthly_avg
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
  WHERE t.user_id = v_user_id
    AND LOWER(c.name) = 'ahorro'
    AND t.date::DATE >= (CURRENT_DATE - INTERVAL '3 months');

  -- Goals con cálculos
  SELECT COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id',            g.id,
        'name',          g.name,
        'target_amount', g.target_amount,
        'target_date',   g.target_date,
        'created_at',    g.created_at,
        'percentage',    CASE
                           WHEN g.target_amount IS NOT NULL AND g.target_amount > 0
                           THEN ROUND((v_total_saved / g.target_amount * 100)::NUMERIC, 1)
                           ELSE NULL
                         END,
        'monthly_avg',   v_monthly_avg,
        'months_to_goal', CASE
                            WHEN g.target_amount IS NOT NULL
                              AND g.target_amount > v_total_saved
                              AND v_monthly_avg > 0
                            THEN CEIL(((g.target_amount - v_total_saved) / v_monthly_avg)::NUMERIC)
                            ELSE NULL
                          END
      )
      ORDER BY g.created_at ASC
    ),
    '[]'::JSON
  )
  INTO v_goals
  FROM savings_goals g
  WHERE g.user_id = v_user_id;

  RETURN JSON_BUILD_OBJECT(
    'total_saved', v_total_saved,
    'monthly_avg', v_monthly_avg,
    'goals',       v_goals
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_savings_summary() TO authenticated;
