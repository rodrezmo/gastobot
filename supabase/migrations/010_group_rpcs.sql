-- 010_group_rpcs.sql
-- Fix vaquitas: remove self-referential RLS policies on group_members (infinite recursion),
-- add simple non-recursive policies, create SECURITY DEFINER RPCs for cross-table operations.
-- Same pattern as 009_shared_expenses_rpcs.sql

-- =============================================
-- 1. Drop self-referential policies
-- =============================================

-- These two policies query group_members FROM WITHIN group_members RLS → infinite recursion
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Admin can manage members" ON public.group_members;

-- =============================================
-- 2. Simple non-recursive replacement policies
-- =============================================

-- User can see their own membership row (no subquery to group_members)
CREATE POLICY "User can view own group membership"
  ON public.group_members FOR SELECT
  USING (user_id = auth.uid());

-- Creator can add members: references groups table (not group_members) → no recursion
-- Also allows the bootstrap case (creator adding themselves as first admin)
CREATE POLICY "Creator can add members to group"
  ON public.group_members FOR INSERT
  WITH CHECK (
    group_id IN (SELECT id FROM public.groups WHERE creator_id = auth.uid())
  );

-- Creator can remove members
CREATE POLICY "Creator can remove members from group"
  ON public.group_members FOR DELETE
  USING (
    group_id IN (SELECT id FROM public.groups WHERE creator_id = auth.uid())
  );

-- =============================================
-- 3. SECURITY DEFINER RPCs
-- =============================================

-- Create group + add creator as admin + add members by email
CREATE OR REPLACE FUNCTION public.create_group_with_members(
  p_name TEXT,
  p_description TEXT,
  p_member_emails TEXT[]
) RETURNS UUID AS $$
DECLARE
  v_group_id UUID;
  v_email TEXT;
  v_member_id UUID;
BEGIN
  -- Insert the group (creator_id = current user)
  INSERT INTO public.groups (name, description, creator_id)
  VALUES (p_name, p_description, auth.uid())
  RETURNING id INTO v_group_id;

  -- Add creator as admin
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, auth.uid(), 'admin');

  -- Add invited members by email (skip if email is creator's own or not found)
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


-- Get all groups the current user belongs to, with full member list
CREATE OR REPLACE FUNCTION public.get_user_groups()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_data ORDER BY (row_data->>'created_at') DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', g.id,
      'name', g.name,
      'description', g.description,
      'creator_id', g.creator_id,
      'status', g.status,
      'currency', g.currency,
      'created_at', g.created_at,
      'settled_at', g.settled_at,
      'archived_at', g.archived_at,
      'members', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', gm.id,
          'group_id', gm.group_id,
          'user_id', gm.user_id,
          'role', gm.role,
          'joined_at', gm.joined_at,
          'user', jsonb_build_object(
            'id', p.id,
            'email', p.email,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
          )
        ))
        FROM public.group_members gm
        JOIN public.profiles p ON p.id = gm.user_id
        WHERE gm.group_id = g.id
      ), '[]'::jsonb)
    ) AS row_data
    FROM public.groups g
    INNER JOIN public.group_members gm_self
      ON gm_self.group_id = g.id AND gm_self.user_id = auth.uid()
  ) sub;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get full detail of a single group (members + expenses + settlements)
CREATE OR REPLACE FUNCTION public.get_group_detail(p_group_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_is_member BOOLEAN;
BEGIN
  -- Security check: current user must be a member of this group
  SELECT EXISTS(
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  SELECT jsonb_build_object(
    'id', g.id,
    'name', g.name,
    'description', g.description,
    'creator_id', g.creator_id,
    'status', g.status,
    'currency', g.currency,
    'created_at', g.created_at,
    'settled_at', g.settled_at,
    'archived_at', g.archived_at,
    'members', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', gm.id,
        'group_id', gm.group_id,
        'user_id', gm.user_id,
        'role', gm.role,
        'joined_at', gm.joined_at,
        'user', jsonb_build_object(
          'id', p.id,
          'email', p.email,
          'full_name', p.full_name,
          'avatar_url', p.avatar_url
        )
      ))
      FROM public.group_members gm
      JOIN public.profiles p ON p.id = gm.user_id
      WHERE gm.group_id = g.id
    ), '[]'::jsonb),
    'expenses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ge.id,
        'group_id', ge.group_id,
        'paid_by', ge.paid_by,
        'amount', ge.amount,
        'description', ge.description,
        'date', ge.date,
        'created_at', ge.created_at,
        'payer', jsonb_build_object(
          'id', p2.id,
          'email', p2.email,
          'full_name', p2.full_name,
          'avatar_url', p2.avatar_url
        )
      ) ORDER BY ge.date DESC, ge.created_at DESC)
      FROM public.group_expenses ge
      JOIN public.profiles p2 ON p2.id = ge.paid_by
      WHERE ge.group_id = g.id
    ), '[]'::jsonb),
    'settlements', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id,
        'from_user_id', s.from_user_id,
        'to_user_id', s.to_user_id,
        'amount', s.amount,
        'group_id', s.group_id,
        'shared_transaction_id', s.shared_transaction_id,
        'status', s.status,
        'note', s.note,
        'created_at', s.created_at,
        'confirmed_at', s.confirmed_at,
        'from_user', jsonb_build_object(
          'id', p3.id,
          'email', p3.email,
          'full_name', p3.full_name,
          'avatar_url', p3.avatar_url
        ),
        'to_user', jsonb_build_object(
          'id', p4.id,
          'email', p4.email,
          'full_name', p4.full_name,
          'avatar_url', p4.avatar_url
        )
      ))
      FROM public.settlements s
      JOIN public.profiles p3 ON p3.id = s.from_user_id
      JOIN public.profiles p4 ON p4.id = s.to_user_id
      WHERE s.group_id = g.id
    ), '[]'::jsonb)
  ) INTO v_result
  FROM public.groups g
  WHERE g.id = p_group_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
