/**
 * POST /api/sms/send-otp
 * Send an OTP to a phone number.
 *
 * Body:
 *   { phone, purpose? }
 *
 * Returns:
 *   { success, provider, mockOtp? (only in mock mode), error? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { sendOtp, getSmsProvider } from '@/lib/server/sms'

export async function POST(req: NextRequest) {
  try {
    const { phone, purpose } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Missing phone' }, { status: 400 })
    }

    // Normalize phone — ensure E.164
    let normalizedPhone = phone.trim()
    if (!normalizedPhone.startsWith('+')) {
      if (normalizedPhone.length === 10) {
        normalizedPhone = '+91' + normalizedPhone  // default to India
      } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
        normalizedPhone = '+' + normalizedPhone
      } else {
        return NextResponse.json(
          { error: 'Phone must be in E.164 format (e.g. +919800000001) or 10-digit Indian number' },
          { status: 400 }
        )
      }
    }

    const result = await sendOtp({
      phone: normalizedPhone,
      purpose: purpose || 'login',
    })

    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[sms/send-otp] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * GET /api/sms/send-otp
 * Returns the currently-configured SMS provider.
 */
export async function GET() {
  return NextResponse.json({
    provider: getSmsProvider(),
    isConfigured: getSmsProvider() !== 'mock',
  })
}
