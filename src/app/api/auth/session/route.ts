/**
 * POST /api/auth/session
 * Returns the current authenticated user's session info.
 *
 * Headers:
 *   Authorization: Bearer <firebase-id-token>
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/server/auth'

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    user: {
      firebase_uid: user.firebase_uid,
      email: user.email,
      email_verified: user.email_verified,
      phone: user.phone,
      name: user.name,
      picture: user.picture,
      dbUser: user.dbUser,
    },
  })
}
