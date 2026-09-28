import { supabase } from './supabase';

export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from('gyms')
    .select('id, name')
    .limit(1);

  if (error) {
    console.error('Supabase connection/database error:', error);
    return { success: false, error };
  }

  console.log('Supabase connection successful:', data);
  return { success: true, data };
}