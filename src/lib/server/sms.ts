/**
 * SMS OTP integration — supports both Twilio and MSG91.
 *
 * Auto-detects which provider to use based on env vars:
 *   - If TWILIO_ACCOUNT_SID is set → use Twilio
 *   - If MSG91_AUTH_KEY is set → use MSG91
 *   - Otherwise → mock mode (logs OTP to console, always returns 123456)
 *
 * Env vars:
 *   # Twilio
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_PHONE_NUMBER=+12345678901  # or your Twilio messaging service SID
 *
 *   # MSG91
 *   MSG91_AUTH_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
 *   MSG91_SENDER_ID=FRESHC
 *   MSG91_TEMPLATE_ID=xxxxxxxx  # DLT-approved template ID
 *
 *   # Common
 *   OTP_TTL_SECONDS=300  # 5 minutes default
 *   OTP_LENGTH=6
 */
import Twilio from 'twilio'
import { getSupabaseServer } from './supabase-server'

export type SmsProvider = 'twilio' | 'msg91' | 'mock'

export function getSmsProvider(): SmsProvider {
  if (process.env.TWILIO_ACCOUNT_SID) return 'twilio'
  if (process.env.MSG91_AUTH_KEY) return 'msg91'
  return 'mock'
}

let twilioClient: any = null

function getTwilioClient() {
  if (twilioClient) return twilioClient
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return null
  twilioClient = Twilio(sid, token)
  return twilioClient
}

/**
 * Generate a random numeric OTP of the configured length.
 */
function generateOtp(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }
  return otp
}

/**
 * Send an OTP via SMS. Stores the OTP in the otp_codes table with an expiry.
 *
 * Returns the OTP only in mock mode (for dev). In production, the OTP is
 * delivered via SMS and never returned by this function.
 */
export async function sendOtp(params: {
  phone: string  // E.164 format, e.g. +919800000001
  purpose?: 'login' | 'register' | 'verify' | 'reset'
}): Promise<{
  success: boolean
  provider: SmsProvider
  mockOtp?: string  // only in mock mode
  error?: string
}> {
  const provider = getSmsProvider()
  const otpLength = parseInt(process.env.OTP_LENGTH || '6', 10)
  const ttlSeconds = parseInt(process.env.OTP_TTL_SECONDS || '300', 10)
  const otp = generateOtp(otpLength)

  // 1. Persist to DB
  const supabase = getSupabaseServer()
  if (supabase) {
    try {
      // Invalidate any previous unused OTPs for this phone
      await supabase
        .from('otp_codes')
        .update({ is_used: true })
        .eq('phone', params.phone)
        .eq('is_used', false)
      // Insert new OTP
      await supabase.from('otp_codes').insert({
        phone: params.phone,
        code: otp,
        purpose: params.purpose || 'login',
        is_used: false,
        expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      })
    } catch (e) {
      console.error('[sms] failed to persist OTP:', e)
    }
  }

  // 2. Send via provider
  if (provider === 'mock') {
    console.log(`\n[OTP MOCK] Phone: ${params.phone} | OTP: ${otp}\n`)
    return { success: true, provider: 'mock', mockOtp: otp }
  }

  if (provider === 'twilio') {
    const client = getTwilioClient()
    if (!client) return { success: false, provider: 'twilio', error: 'Twilio not configured' }

    try {
      await client.messages.create({
        body: `Your Food Munch verification code is ${otp}. Valid for ${Math.floor(ttlSeconds / 60)} minutes. Do not share.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: params.phone,
      })
      return { success: true, provider: 'twilio' }
    } catch (e: any) {
      console.error('[sms] Twilio send failed:', e)
      return { success: false, provider: 'twilio', error: e?.message }
    }
  }

  if (provider === 'msg91') {
    const authKey = process.env.MSG91_AUTH_KEY
    const senderId = process.env.MSG91_SENDER_ID || 'FRESHC'
    const templateId = process.env.MSG91_TEMPLATE_ID

    if (!authKey) return { success: false, provider: 'msg91', error: 'MSG91_AUTH_KEY not set' }

    try {
      // MSG91 OTP API: https://docs.msg91.com
      // We use the send-otp endpoint
      const phoneStripped = params.phone.replace(/^\+/, '')
      const url = `https://api.msg91.com/api/v5/otp`

      const body: Record<string, any> = {
        template_id: templateId,
        mobile: phoneStripped,
        authkey: authKey,
        otp: otp,
        sender: senderId,
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const text = await response.text()
        return { success: false, provider: 'msg91', error: `MSG91 API error: ${text}` }
      }

      return { success: true, provider: 'msg91' }
    } catch (e: any) {
      console.error('[sms] MSG91 send failed:', e)
      return { success: false, provider: 'msg91', error: e?.message }
    }
  }

  return { success: false, provider, error: 'Unknown provider' }
}

/**
 * Verify an OTP entered by the user.
 *
 * Checks the otp_codes table for:
 *   - matching phone
 *   - matching code
 *   - not used
 *   - not expired
 *
 * On success, marks the OTP as used.
 */
export async function verifyOtp(params: {
  phone: string
  code: string
}): Promise<{
  success: boolean
  error?: string
}> {
  const provider = getSmsProvider()

  // Mock mode: accept 123456 always
  if (provider === 'mock') {
    if (params.code === '123456') {
      return { success: true }
    }
    return { success: false, error: 'Invalid OTP. In mock mode, use 123456' }
  }

  const supabase = getSupabaseServer()
  if (!supabase) {
    return { success: false, error: 'Database not configured' }
  }

  try {
    // Find the most recent unused, non-expired OTP for this phone
    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', params.phone)
      .eq('code', params.code)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      // Increment attempts for the most recent OTP
      await supabase.rpc('increment_otp_attempts', { p_phone: params.phone })
      return { success: false, error: 'Invalid or expired OTP' }
    }

    // Mark as used
    await supabase
      .from('otp_codes')
      .update({ is_used: true })
      .eq('id', data.id)

    return { success: true }
  } catch (e: any) {
    console.error('[sms] verify failed:', e)
    return { success: false, error: e?.message || 'Verification failed' }
  }
}

/**
 * Resend OTP (rate-limited — 60 seconds between resends).
 */
export async function resendOtp(params: {
  phone: string
  purpose?: 'login' | 'register' | 'verify' | 'reset'
}): Promise<{
  success: boolean
  mockOtp?: string
  error?: string
}> {
  const supabase = getSupabaseServer()

  if (supabase) {
    // Check if there's a recent OTP (less than 60s old)
    const { data } = await supabase
      .from('otp_codes')
      .select('created_at')
      .eq('phone', params.phone)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      const age = Date.now() - new Date(data.created_at).getTime()
      if (age < 60000) {
        return { success: false, error: 'Please wait 60 seconds before requesting a new OTP' }
      }
    }
  }

  return sendOtp(params)
}
