/**
 * POST /api/sms/verify-otp
 * Verify an OTP entered by the user.
 *
 * Body:
 *   { phone, code }
 *
 * Returns:
 *   { success, error? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/server/sms'

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return NextResponse.json({ error: 'Missing phone or code' }, { status: 400 })
    }

    // Normalize phone
    let normalizedPhone = phone.trim()
    if (!normalizedPhone.startsWith('+')) {
      if (normalizedPhone.length === 10) {
        normalizedPhone = '+91' + normalizedPhone
      } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
        normalizedPhone = '+' + normalizedPhone
      }
    }

    const result = await verifyOtp({ phone: normalizedPhone, code })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[sms/verify-otp] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
