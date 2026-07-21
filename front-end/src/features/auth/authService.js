import { hasSupabaseConfig, supabase } from '../../lib/supabaseClient.js';

function requireSupabase() {
  if (!hasSupabaseConfig || !supabase) {
    throw new Error('Autenticacao indisponivel. Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.');
  }
  return supabase;
}

export async function getAuthSession() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

export function subscribeToAuthChanges(callback) {
  const client = requireSupabase();
  const { data } = client.auth.onAuthStateChange((event, session) => callback(session, event));
  return () => data.subscription.unsubscribe();
}

export async function signInWithPassword(email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut({ allDevices = false } = {}) {
  const client = requireSupabase();
  const { error } = await client.auth.signOut(allDevices ? { scope: 'global' } : undefined);
  if (error) throw error;
}
