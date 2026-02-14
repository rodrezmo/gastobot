import { supabase } from '@/lib/supabase.ts';
import type { Category } from '@/types/database.ts';
import type { CreateCategoryParams } from '@/types/api.ts';

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data as Category[];
}

export async function createCategory(params: CreateCategoryParams): Promise<Category> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...params, user_id: session.user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  id: string,
  params: Partial<CreateCategoryParams>,
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(params)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function getDefaultCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_default', true)
    .order('type')
    .order('name');
  if (error) throw error;
  return data as Category[];
}
