-- Create category type enum
CREATE TYPE category_type AS ENUM ('income', 'expense');

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'circle',
  color TEXT NOT NULL DEFAULT '#6366f1',
  type category_type NOT NULL DEFAULT 'expense',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to seed default categories for a new user
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Expense categories
  INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (NEW.id, 'Comida', 'utensils', '#ef4444', 'expense', true),
    (NEW.id, 'Transporte', 'car', '#f97316', 'expense', true),
    (NEW.id, 'Entretenimiento', 'gamepad-2', '#8b5cf6', 'expense', true),
    (NEW.id, 'Salud', 'heart-pulse', '#ec4899', 'expense', true),
    (NEW.id, 'Educación', 'graduation-cap', '#3b82f6', 'expense', true),
    (NEW.id, 'Hogar', 'home', '#14b8a6', 'expense', true),
    (NEW.id, 'Ropa', 'shirt', '#f59e0b', 'expense', true),
    (NEW.id, 'Otros', 'circle', '#6b7280', 'expense', true);

  -- Income categories
  INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (NEW.id, 'Salario', 'banknote', '#22c55e', 'income', true),
    (NEW.id, 'Freelance', 'laptop', '#06b6d4', 'income', true),
    (NEW.id, 'Inversiones', 'trending-up', '#a855f7', 'income', true),
    (NEW.id, 'Otros', 'circle', '#6b7280', 'income', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_seed_categories
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_categories();
