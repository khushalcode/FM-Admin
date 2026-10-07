/**
 * Server-side Supabase client (uses service role key — bypasses RLS).
 *
 * Use this ONLY in API routes / server components where you need
 * elevated database access. NEVER expose the service role key to the client.
 *
 * For client-side queries, use `/lib/supabase.ts` (anon key, RLS-enforced).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const isSupabaseServerConfigured =
  !!supabaseUrl && !!serviceRoleKey

let client: SupabaseClient | null = null

export function getSupabaseServer(): SupabaseClient | null {
  if (!isSupabaseServerConfigured) return null
  if (!client) {
    client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

/**
 * Get a Supabase client scoped to the current user's RLS policies.
 * Pass the user's Firebase ID token; we exchange it via Supabase's
 * Firebase JWT integration.
 *
 * For simplicity in this codebase, we use the anon client on the
 * server and rely on RLS policies for security. For stricter security,
 * migrate to per-user clients (requires Supabase + Firebase JWT integration).
 */
export function getSupabaseWithRls(): SupabaseClient {
  // For now, use anon client. RLS still applies.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
