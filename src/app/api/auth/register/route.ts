/**
 * POST /api/auth/register
 * Registers a new user in the database after Firebase Auth creates them.
 *
 * Body:
 *   { firebase_uid, email, phone, full_name, role, avatar_url? }
 *
 * Returns the created user row.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/server/supabase-server'
import { verifyIdToken, setUserClaims } from '@/lib/server/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firebase_uid, email, phone, full_name, role, avatar_url } = body

    if (!firebase_uid || !email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: firebase_uid, email, full_name, role' },
        { status: 400 }
      )
    }

    // Verify the Firebase token (if Admin SDK is configured)
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '')
    if (token) {
      const decoded = await verifyIdToken(token)
      if (!decoded || decoded.uid !== firebase_uid) {
        return NextResponse.json(
          { error: 'Token does not match firebase_uid' },
          { status: 403 }
        )
      }
    }

    // Set custom claims on Firebase user (role)
    await setUserClaims(firebase_uid, { role })

    const supabase = getSupabaseServer()
    if (!supabase) {
      // Mock mode — return success without persisting
      return NextResponse.json({
        success: true,
        user: {
          id: 'mock-user-id',
          firebase_uid,
          email,
          phone,
          full_name,
          role,
          avatar_url,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        mode: 'mock',
      })
    }

    // 1. Insert into users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        firebase_uid,
        email,
        phone,
        full_name,
        role,
        avatar_url,
        is_active: true,
        is_email_verified: true,
      })
      .select()
      .single()

    if (userError) {
      console.error('[register] user insert failed:', userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // 2. Insert into role-specific table
    if (role === 'customer') {
      await supabase.from('customers').insert({
        user_id: user.id,
      })
      // Create wallet
      await supabase.from('wallets').insert({
        user_id: user.id,
        balance: 0,
      })
    } else if (role === 'vendor') {
      await supabase.from('vendors').insert({
        user_id: user.id,
        is_approved: false,
      })
    } else if (role === 'delivery') {
      await supabase.from('delivery_men').insert({
        user_id: user.id,
        is_approved: false,
      })
    }

    return NextResponse.json({ success: true, user })
  } catch (e: any) {
    console.error('[register] error:', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
