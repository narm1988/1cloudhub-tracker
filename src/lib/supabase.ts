import { createClient } from '@supabase/supabase-js'
import { getToken } from './api'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Auth is no longer handled by Supabase — this backend's own JWT (signed
// with the key registered as this project's JWT Signing Key) is attached
// to every request instead, so RLS's `auth.uid()` keeps working against
// it exactly as it would against a GoTrue-issued token. supabase.auth.*
// is never called; only .from(...) (still Postgres+RLS) stays in use here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => getToken(),
})
