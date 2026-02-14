-- Monthly totals function
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
    AND EXTRACT(MONTH FROM t.date) = p_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Category breakdown function
CREATE OR REPLACE FUNCTION public.get_category_breakdown(
  p_user_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_icon TEXT,
  category_color TEXT,
  category_type category_type,
  total NUMERIC,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.color AS category_color,
    c.type AS category_type,
    COALESCE(SUM(t.amount), 0) AS total,
    COUNT(t.id) AS transaction_count
  FROM public.categories c
  LEFT JOIN public.transactions t
    ON t.category_id = c.id
    AND t.date >= p_date_from
    AND t.date <= p_date_to
  WHERE c.user_id = p_user_id
  GROUP BY c.id, c.name, c.icon, c.color, c.type
  HAVING COUNT(t.id) > 0
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Monthly trend function (last N months)
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
  GROUP BY DATE_TRUNC('month', t.date)
  ORDER BY DATE_TRUNC('month', t.date) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Overall balance function
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
  WHERE t.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
