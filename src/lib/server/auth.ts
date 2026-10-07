/**
 * Auth helper — extract & verify the Firebase ID token from a request.
 * Returns the user record or null.
 */
import { NextRequest } from 'next/server'
import { verifyIdToken } from './firebase-admin'
import { getSupabaseServer } from './supabase-server'
import type { AppUser } from '@/lib/types'

export interface AuthenticatedUser {
  firebase_uid: string
  email: string
  email_verified: boolean
  phone?: string
  name?: string
  picture?: string
  dbUser?: AppUser  // user row from our `users` table
}

/**
 * Extract the Bearer token from an Authorization header.
 */
export function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

/**
 * Authenticate a request. Returns the user or null.
 *
 * If Firebase Admin is configured, verifies the token via Firebase.
 * If not configured, returns a mock admin user (dev mode).
 *
 * If Supabase is configured, also fetches the corresponding row from
 * the `users` table to attach role + metadata.
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  const token = extractBearerToken(req)

  if (!token) {
    // No token — allow only in mock mode (dev)
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      return {
        firebase_uid: 'mock-uid',
        email: 'admin@foodmunch.com',
        email_verified: true,
      }
    }
    return null
  }

  const decoded = await verifyIdToken(token)
  if (!decoded) return null

  const user: AuthenticatedUser = {
    firebase_uid: decoded.uid,
    email: decoded.email || '',
    email_verified: decoded.email_verified || false,
    phone: decoded.phone_number,
    name: decoded.name,
    picture: decoded.picture,
  }

  // Look up user in our DB
  const supabase = getSupabaseServer()
  if (supabase) {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', decoded.uid)
        .single()
      if (data) {
        user.dbUser = data as AppUser
      }
    } catch (e) {
      console.warn('[auth] user lookup failed:', e)
    }
  }

  return user
}

/**
 * Require admin role — returns 401 if not authed, 403 if not admin.
 */
export async function requireAdmin(req: NextRequest): Promise<{
  user: AuthenticatedUser
  response?: never
} | {
  user?: never
  response: Response
}> {
  const user = await authenticateRequest(req)
  if (!user) {
    return {
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }
  if (user.dbUser && user.dbUser.role !== 'admin') {
    return {
      response: new Response(JSON.stringify({ error: 'Forbidden — admin role required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }
  return { user }
}
