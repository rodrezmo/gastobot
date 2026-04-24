-- ============================================================
-- 017_currency.sql
-- Soporte multi-moneda en transactions
-- ============================================================

-- Campo currency en transactions (ARS por defecto para datos existentes)
ALTER TABLE transactions ADD COLUMN currency TEXT NOT NULL DEFAULT 'ARS';

-- ============================================================
-- Actualizar funciones de balance para solo contar ARS
-- Las transacciones en USD (ahorros en divisas) no afectan el balance ARS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_monthly_summary(
  p_user_id UUID,
  p_year INT,
  p_month INT
)
RETURNS TABLE (
  total_income NUMERIC,
  total_expense NUMERIC,
  balance NUMERIC,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) AS balance,
    COUNT(*) AS transaction_count
  FROM public.transactions t
  WHERE t.user_id = p_user_id
    AND EXTRACT(YEAR FROM t.date) = p_year
    AND EXTRACT(MONTH FROM t.date) = p_month
    AND t.currency = 'ARS';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_balance(
  p_user_id UUID
)
RETURNS TABLE (
  total_income NUMERIC,
  total_expense NUMERIC,
  balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) AS balance
  FROM public.transactions t
  WHERE t.user_id = p_user_id
    AND t.currency = 'ARS';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_monthly_trend(
  p_user_id UUID,
  p_months INT DEFAULT 6
)
RETURNS TABLE (
  month_year TEXT,
  total_income NUMERIC,
  total_expense NUMERIC,
  balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', t.date), 'YYYY-MM') AS month_year,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) AS balance
  FROM public.transactions t
  WHERE t.user_id = p_user_id
    AND t.date >= DATE_TRUNC('month', CURRENT_DATE) - (p_months || ' months')::INTERVAL
    AND t.currency = 'ARS'
  GROUP BY DATE_TRUNC('month', t.date)
  ORDER BY DATE_TRUNC('month', t.date) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- get_savings_summary con soporte multi-moneda
-- ============================================================
CREATE OR REPLACE FUNCTION get_savings_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       UUID;
  v_total_ars     NUMERIC;
  v_total_usd     NUMERIC;
  v_monthly_avg   NUMERIC;
  v_goals         JSON;
BEGIN
  v_user_id := auth.uid();

  -- Total ahorrado en ARS (transacciones con categoría Ahorro y currency ARS)
  SELECT COALESCE(SUM(t.amount), 0)
  INTO v_total_ars
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
  WHERE t.user_id = v_user_id
    AND LOWER(c.name) = 'ahorro'
    AND UPPER(t.currency) = 'ARS';

  -- Total ahorrado en USD
  SELECT COALESCE(SUM(t.amount), 0)
  INTO v_total_usd
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
  WHERE t.user_id = v_user_id
    AND LOWER(c.name) = 'ahorro'
    AND UPPER(t.currency) = 'USD';

  -- Promedio mensual en ARS (últimos 3 meses)
  SELECT COALESCE(
    SUM(t.amount) / NULLIF(COUNT(DISTINCT TO_CHAR(t.date::DATE, 'YYYY-MM')), 0),
    0
  )
  INTO v_monthly_avg
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
  WHERE t.user_id = v_user_id
    AND LOWER(c.name) = 'ahorro'
    AND UPPER(t.currency) = 'ARS'
    AND t.date::DATE >= (CURRENT_DATE - INTERVAL '3 months');

  -- Goals con cálculos (referenciados en ARS)
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
                           THEN ROUND((v_total_ars / g.target_amount * 100)::NUMERIC, 1)
                           ELSE NULL
                         END,
        'monthly_avg',   v_monthly_avg,
        'months_to_goal', CASE
                            WHEN g.target_amount IS NOT NULL
                              AND g.target_amount > v_total_ars
                              AND v_monthly_avg > 0
                            THEN CEIL(((g.target_amount - v_total_ars) / v_monthly_avg)::NUMERIC)
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
    'total_saved', v_total_ars,
    'total_ars',   v_total_ars,
    'total_usd',   v_total_usd,
    'monthly_avg', v_monthly_avg,
    'goals',       v_goals
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_savings_summary() TO authenticated;
