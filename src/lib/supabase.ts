/**
 * Supabase client.
 *
 * Real Food Munch Supabase project: https://dhmeyycjosacuwgtdhfo.supabase.co
 * The anon key can be overridden via NEXT_PUBLIC_SUPABASE_ANON_KEY env var.
 *
 * Until real anon key is provided, the admin UI falls back to localStorage
 * based persistence (see /lib/admin-data.ts).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dhmeyycjosacuwgtdhfo.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
