-- 012_contacts.sql
-- Agenda de contactos con nickname único e inmutable.
-- Reemplaza la búsqueda por email con búsqueda por @nickname.
-- Agrega tabla contacts para persistir agenda personal.
-- Actualiza RPCs de grupos para aceptar user_id en lugar de email.

-- =============================================
-- 1. Columna nickname en profiles
-- =============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Index case-insensitive para unicidad
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_nickname
  ON public.profiles(LOWER(nickname))
  WHERE nickname IS NOT NULL;

-- =============================================
-- 2. Trigger: bloquear cambio de nickname una vez seteado
-- =============================================

CREATE OR REPLACE FUNCTION public.prevent_nickname_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.nickname IS NOT NULL AND NEW.nickname IS DISTINCT FROM OLD.nickname THEN
    RAISE EXCEPTION 'El nickname no se puede cambiar una vez definido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lock_nickname ON public.profiles;
CREATE TRIGGER lock_nickname
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_nickname_change();

-- =============================================
-- 3. Tabla contacts
-- =============================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, contact_id),
  CHECK (user_id != contact_id)
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User manages own contacts" ON public.contacts;
CREATE POLICY "User manages own contacts"
  ON public.contacts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- 4. search_users_by_nickname — reemplaza search_users_by_email
-- =============================================

CREATE OR REPLACE FUNCTION public.search_users_by_nickname(search_query TEXT)
RETURNS TABLE (
  id UUID,
  nickname TEXT,
  masked_email TEXT,
  full_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.nickname,
    LEFT(p.email, 2) || '***@' || SPLIT_PART(p.email, '@', 2) AS masked_email,
    p.full_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.nickname ILIKE '%' || search_query || '%'
    AND p.id != auth.uid()
    AND p.nickname IS NOT NULL
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. get_my_contacts — agenda guardada con email enmascarado
-- =============================================

CREATE OR REPLACE FUNCTION public.get_my_contacts()
RETURNS TABLE (
  id UUID,
  nickname TEXT,
  masked_email TEXT,
  full_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.nickname,
    LEFT(p.email, 2) || '***@' || SPLIT_PART(p.email, '@', 2),
    p.full_name,
    p.avatar_url
  FROM public.contacts c
  JOIN public.profiles p ON p.id = c.contact_id
  WHERE c.user_id = auth.uid()
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. save_contact — guardar contacto al seleccionar
-- =============================================

CREATE OR REPLACE FUNCTION public.save_contact(p_contact_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.contacts (user_id, contact_id)
  VALUES (auth.uid(), p_contact_id)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. create_group_with_member_ids — variante que acepta UUIDs
--    (evita enviar emails al cliente)
-- =============================================

CREATE OR REPLACE FUNCTION public.create_group_with_member_ids(
  p_name TEXT,
  p_description TEXT,
  p_member_ids UUID[],
  p_currency TEXT DEFAULT 'ARS'
) RETURNS UUID AS $$
DECLARE
  v_group_id UUID;
  v_member_id UUID;
BEGIN
  INSERT INTO public.groups (name, description, creator_id, currency)
  VALUES (p_name, p_description, auth.uid(), p_currency)
  RETURNING id INTO v_group_id;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, auth.uid(), 'admin');

  IF p_member_ids IS NOT NULL THEN
    FOREACH v_member_id IN ARRAY p_member_ids LOOP
      IF v_member_id != auth.uid() THEN
        INSERT INTO public.group_members (group_id, user_id, role)
        VALUES (v_group_id, v_member_id, 'member')
        ON CONFLICT (group_id, user_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. add_member_to_group_by_id — variante que acepta UUID
-- =============================================

CREATE OR REPLACE FUNCTION public.add_member_to_group_by_id(
  p_group_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_is_creator BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND creator_id = auth.uid()
  ) INTO v_is_creator;

  IF NOT v_is_creator THEN
    RAISE EXCEPTION 'Solo el creador puede agregar miembros';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No podés agregarte a vos mismo';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (p_group_id, p_user_id, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
