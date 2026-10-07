/**
 * POST /api/notifications/send
 * Send a push notification (admin only).
 *
 * Body:
 *   { user_id?, user_role?, title, body, type, data?, image_url? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/server/auth'
import { sendNotification } from '@/lib/server/notifications'

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Only admins can broadcast
  if (user.dbUser && user.dbUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { user_id, user_role, title, body: notifBody, type, data, image_url } = body

    if (!title || !notifBody || !type) {
      return NextResponse.json(
        { error: 'Missing: title, body, type' },
        { status: 400 }
      )
    }

    const result = await sendNotification({
      userId: user_id,
      userRole: user_role,
      title,
      body: notifBody,
      type,
      data,
      imageUrl: image_url,
    })

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
