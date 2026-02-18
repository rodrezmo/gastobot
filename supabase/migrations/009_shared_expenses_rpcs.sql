-- 009_shared_expenses_rpcs.sql
-- SECURITY DEFINER functions para shared expenses
-- Reemplaza políticas RLS circulares entre shared_transactions y shared_transaction_participants
--
-- NOTA: Esta migración fue ejecutada manualmente en SQL Editor en múltiples pasos.
-- Este archivo consolida todas las funciones finales.

-- =============================================
-- 1. Eliminar trigger y políticas circulares
-- =============================================

DROP TRIGGER IF EXISTS on_shared_expense_accepted ON public.shared_transaction_participants;
DROP FUNCTION IF EXISTS public.handle_shared_expense_accepted();

DROP POLICY IF EXISTS "Participants can view shared original transactions" ON public.transactions;
DROP POLICY IF EXISTS "Participants can view shared transactions" ON public.shared_transactions;
DROP POLICY IF EXISTS "Owner can view all participants of their shared transactions" ON public.shared_transaction_participants;

-- =============================================
-- 2. SECURITY DEFINER: Crear gasto compartido
-- =============================================

CREATE OR REPLACE FUNCTION public.create_shared_transaction(
  p_transaction_id UUID,
  p_split_method TEXT,
  p_total_amount NUMERIC,
  p_note TEXT,
  p_participants JSONB -- [{"user_id": "...", "amount": 123, "percentage": null}]
)
RETURNS UUID AS $$
DECLARE
  v_shared_id UUID;
  v_participant JSONB;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE id = p_transaction_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Transaccion no encontrada';
  END IF;

  INSERT INTO public.shared_transactions (transaction_id, owner_id, split_method, total_amount, note)
  VALUES (p_transaction_id, v_user_id, p_split_method::split_method, p_total_amount, p_note)
  RETURNING id INTO v_shared_id;

  FOR v_participant IN SELECT * FROM jsonb_array_elements(p_participants)
  LOOP
    INSERT INTO public.shared_transaction_participants (shared_transaction_id, user_id, amount, percentage, status)
    VALUES (
      v_shared_id,
      (v_participant->>'user_id')::UUID,
      (v_participant->>'amount')::NUMERIC,
      (v_participant->>'percentage')::NUMERIC,
      CASE WHEN (v_participant->>'user_id')::UUID = v_user_id THEN 'accepted'::participant_status ELSE 'pending'::participant_status END
    );
  END LOOP;

  RETURN v_shared_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. SECURITY DEFINER: Obtener pendientes (User B)
-- =============================================

CREATE OR REPLACE FUNCTION public.get_pending_shared_expenses()
RETURNS TABLE (
  participant_id UUID,
  participant_amount NUMERIC,
  participant_percentage NUMERIC,
  participant_status TEXT,
  shared_id UUID,
  split_method TEXT,
  total_amount NUMERIC,
  note TEXT,
  shared_created_at TIMESTAMPTZ,
  owner_id UUID,
  owner_email TEXT,
  owner_full_name TEXT,
  owner_avatar_url TEXT,
  tx_id UUID,
  tx_description TEXT,
  tx_amount NUMERIC,
  tx_type TEXT,
  tx_date DATE,
  tx_category_name TEXT,
  tx_category_icon TEXT,
  tx_category_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    stp.id AS participant_id,
    stp.amount AS participant_amount,
    stp.percentage AS participant_percentage,
    stp.status::TEXT AS participant_status,
    st.id AS shared_id,
    st.split_method::TEXT AS split_method,
    st.total_amount,
    st.note,
    st.created_at AS shared_created_at,
    p.id AS owner_id,
    p.email AS owner_email,
    p.full_name AS owner_full_name,
    p.avatar_url AS owner_avatar_url,
    t.id AS tx_id,
    t.description AS tx_description,
    t.amount AS tx_amount,
    t.type::TEXT AS tx_type,
    t.date AS tx_date,
    c.name AS tx_category_name,
    c.icon AS tx_category_icon,
    c.color AS tx_category_color
  FROM public.shared_transaction_participants stp
  JOIN public.shared_transactions st ON st.id = stp.shared_transaction_id
  JOIN public.profiles p ON p.id = st.owner_id
  JOIN public.transactions t ON t.id = st.transaction_id
  LEFT JOIN public.categories c ON c.id = t.category_id
  WHERE stp.user_id = auth.uid()
    AND stp.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. SECURITY DEFINER: Mis compartidos (User A)
-- =============================================

CREATE OR REPLACE FUNCTION public.get_my_shared_expenses()
RETURNS TABLE (
  shared_id UUID,
  split_method TEXT,
  total_amount NUMERIC,
  note TEXT,
  shared_created_at TIMESTAMPTZ,
  tx_id UUID,
  tx_description TEXT,
  tx_amount NUMERIC,
  tx_type TEXT,
  tx_date DATE,
  tx_category_name TEXT,
  participant_id UUID,
  participant_user_id UUID,
  participant_amount NUMERIC,
  participant_percentage NUMERIC,
  participant_status TEXT,
  participant_email TEXT,
  participant_full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id AS shared_id,
    st.split_method::TEXT,
    st.total_amount,
    st.note,
    st.created_at AS shared_created_at,
    t.id AS tx_id,
    t.description AS tx_description,
    t.amount AS tx_amount,
    t.type::TEXT AS tx_type,
    t.date AS tx_date,
    c.name AS tx_category_name,
    stp.id AS participant_id,
    stp.user_id AS participant_user_id,
    stp.amount AS participant_amount,
    stp.percentage AS participant_percentage,
    stp.status::TEXT AS participant_status,
    pp.email AS participant_email,
    pp.full_name AS participant_full_name
  FROM public.shared_transactions st
  JOIN public.transactions t ON t.id = st.transaction_id
  LEFT JOIN public.categories c ON c.id = t.category_id
  JOIN public.shared_transaction_participants stp ON stp.shared_transaction_id = st.id
  JOIN public.profiles pp ON pp.id = stp.user_id
  WHERE st.owner_id = auth.uid()
  ORDER BY st.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. SECURITY DEFINER: Aceptar/Rechazar (User B)
-- =============================================

CREATE OR REPLACE FUNCTION public.respond_to_shared_expense(
  p_participant_id UUID,
  p_status TEXT
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_row shared_transaction_participants%ROWTYPE;
  v_shared shared_transactions%ROWTYPE;
  v_original transactions%ROWTYPE;
  v_target_category_id UUID;
  v_new_tx_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT * INTO v_row
  FROM public.shared_transaction_participants
  WHERE id = p_participant_id AND user_id = v_user_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participacion no encontrada o ya respondida';
  END IF;

  IF p_status = 'accepted' THEN
    SELECT * INTO v_shared FROM public.shared_transactions WHERE id = v_row.shared_transaction_id;
    SELECT * INTO v_original FROM public.transactions WHERE id = v_shared.transaction_id;

    -- Buscar categoría equivalente del usuario destino (por nombre y tipo, cast via TEXT)
    SELECT c2.id INTO v_target_category_id
    FROM public.categories c1
    JOIN public.categories c2 ON c2.name = c1.name AND c2.type::TEXT = c1.type::TEXT AND c2.user_id = v_user_id
    WHERE c1.id = v_original.category_id
    LIMIT 1;

    -- Fallback: primera categoría del mismo tipo
    IF v_target_category_id IS NULL THEN
      SELECT id INTO v_target_category_id
      FROM public.categories
      WHERE user_id = v_user_id AND type::TEXT = v_original.type::TEXT
      LIMIT 1;
    END IF;

    INSERT INTO public.transactions (user_id, category_id, amount, type, description, date)
    VALUES (
      v_user_id,
      v_target_category_id,
      v_row.amount,
      v_original.type,
      COALESCE(v_original.description, '') || ' (compartido)',
      v_original.date
    )
    RETURNING id INTO v_new_tx_id;

    UPDATE public.shared_transaction_participants
    SET status = 'accepted'::participant_status,
        responded_at = now(),
        created_transaction_id = v_new_tx_id
    WHERE id = p_participant_id;
  ELSE
    UPDATE public.shared_transaction_participants
    SET status = p_status::participant_status,
        responded_at = now()
    WHERE id = p_participant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
