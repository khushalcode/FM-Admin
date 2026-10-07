/**
 * POST /api/notifications/register-fcm
 * Register/update the user's FCM token for push notifications.
 *
 * Body:
 *   { fcm_token }
 *
 * Headers:
 *   Authorization: Bearer <firebase-id-token>
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/server/auth'
import { getSupabaseServer } from '@/lib/server/supabase-server'
import { subscribeToTopic } from '@/lib/server/firebase-admin'

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { fcm_token } = await req.json()
    if (!fcm_token) {
      return NextResponse.json({ error: 'Missing fcm_token' }, { status: 400 })
    }

    const supabase = getSupabaseServer()
    if (!supabase) {
      return NextResponse.json({ success: true, mode: 'mock' })
    }

    // Update the user's FCM token in DB
    const { error } = await supabase
      .from('users')
      .update({ fcm_token })
      .eq('firebase_uid', user.firebase_uid)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Subscribe to role-based topic for broadcast notifications
    if (user.dbUser?.role) {
      await subscribeToTopic([fcm_token], `role_${user.dbUser.role}`)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
