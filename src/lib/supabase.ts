/**
 * Supabase client — the sole DB client for the FM-Admin backend.
 *
 * Prisma was removed in this version. All server-side data access goes
 * through this client OR through the in-memory admin-store fallback
 * (used when Supabase env vars are not set, e.g. local dev / preview).
 *
 * Configure via .env:
 *   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   (server only, for admin ops)
 *
 * When env vars are missing, the admin UI falls back to localStorage /
 * in-memory store (see /lib/admin-data.ts and /lib/server/admin-store.ts).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dhmeyycjosacuwgtdhfo.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-anon-key'

/** Browser-side Supabase client (uses anon key + user session). */
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

/**
 * Server-side Supabase client with service-role key (bypasses RLS).
 * Use ONLY in server-side API routes — never expose to the browser.
 * Falls back to the anon client if the service-role key isn't set.
 */
export function supabaseAdmin(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return supabase
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
