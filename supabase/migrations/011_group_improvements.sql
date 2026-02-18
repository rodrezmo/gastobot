-- 011_group_improvements.sql
-- Add currency param to create_group_with_members
-- Add add_member_to_group RPC for adding members after creation

-- Drop existing function to allow changing signature
DROP FUNCTION IF EXISTS public.create_group_with_members(TEXT, TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION public.create_group_with_members(
  p_name TEXT,
  p_description TEXT,
  p_member_emails TEXT[],
  p_currency TEXT DEFAULT 'ARS'
) RETURNS UUID AS $$
DECLARE
  v_group_id UUID;
  v_email TEXT;
  v_member_id UUID;
BEGIN
  INSERT INTO public.groups (name, description, creator_id, currency)
  VALUES (p_name, p_description, auth.uid(), p_currency)
  RETURNING id INTO v_group_id;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, auth.uid(), 'admin');

  IF p_member_emails IS NOT NULL THEN
    FOREACH v_email IN ARRAY p_member_emails LOOP
      SELECT id INTO v_member_id
      FROM public.profiles
      WHERE email ILIKE v_email
      AND id != auth.uid()
      LIMIT 1;

      IF v_member_id IS NOT NULL THEN
        INSERT INTO public.group_members (group_id, user_id, role)
        VALUES (v_group_id, v_member_id, 'member')
        ON CONFLICT (group_id, user_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Add member to an existing group (creator only)
CREATE OR REPLACE FUNCTION public.add_member_to_group(
  p_group_id UUID,
  p_email TEXT
) RETURNS VOID AS $$
DECLARE
  v_member_id UUID;
  v_is_creator BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND creator_id = auth.uid()
  ) INTO v_is_creator;

  IF NOT v_is_creator THEN
    RAISE EXCEPTION 'Solo el creador puede agregar miembros';
  END IF;

  SELECT id INTO v_member_id
  FROM public.profiles
  WHERE email ILIKE p_email
  AND id != auth.uid()
  LIMIT 1;

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado con ese email';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (p_group_id, v_member_id, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
