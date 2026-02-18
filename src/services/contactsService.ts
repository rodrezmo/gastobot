import { supabase } from '@/lib/supabase.ts';
import type { UserSearchResult } from '@/types/shared.ts';

export async function getMyContacts(): Promise<UserSearchResult[]> {
  const { data, error } = await supabase.rpc('get_my_contacts');
  if (error) throw error;
  return (data as UserSearchResult[]) ?? [];
}

export async function saveContact(contactId: string): Promise<void> {
  const { error } = await supabase.rpc('save_contact', { p_contact_id: contactId });
  if (error) throw error;
}
