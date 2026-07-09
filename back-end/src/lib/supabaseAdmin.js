import { createClient } from '@supabase/supabase-js';
import { assertBackendConfig, env } from '../config/env.js';

assertBackendConfig();

export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
