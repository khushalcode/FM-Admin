/**
 * Razorpay payment gateway integration.
 *
 * Flow:
 *   1. Customer checkout → POST /api/payments/razorpay/create-order
 *      → Returns razorpay_order_id + amount + key
 *   2. Customer pays in app (Razorpay SDK)
 *   3. Client returns razorpay_payment_id + razorpay_signature
 *   4. POST /api/payments/razorpay/verify
 *      → Verifies signature, marks payment as paid, updates order
 *   5. Razorpay sends webhook → POST /api/payments/webhook
 *      → Handles payment.captured, payment.failed events
 *
 * Env vars:
 *   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
 *   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
 *   RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxx
 *
 * Get these from: https://dashboard.razorpay.com/app/keys
 */
import Razorpay from 'razorpay'
import crypto from 'crypto'

let razorpayInstance: Razorpay | null = null

export function getRazorpay(): Razorpay | null {
  if (razorpayInstance) return razorpayInstance

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return null
  }

  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })

  return razorpayInstance
}

export const isRazorpayConfigured =
  !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET

/**
 * Create a Razorpay order.
 */
export async function createRazorpayOrder(params: {
  amount: number  // in INR (will be converted to paise)
  currency?: string  // default INR
  receipt: string  // your internal order ID / code
  notes?: Record<string, string>
}): Promise<{
  success: boolean
  razorpay_order_id?: string
  amount?: number  // in paise
  currency?: string
  key_id?: string  // public key for client SDK
  error?: string
}> {
  const rzp = getRazorpay()
  if (!rzp) {
    return { success: false, error: 'Razorpay not configured' }
  }

  try {
    const order = await rzp.orders.create({
      amount: Math.round(params.amount * 100),  // convert to paise
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes || {},
    })

    return {
      success: true,
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    }
  } catch (e: any) {
    console.error('[razorpay] create order failed:', e)
    return { success: false, error: e?.message || 'Failed to create order' }
  }
}

/**
 * Verify the Razorpay payment signature.
 *
 * Returns true if the signature is valid — payment is confirmed.
 */
export function verifyRazorpaySignature(params: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) {
    console.error('[razorpay] RAZORPAY_KEY_SECRET not set')
    return false
  }

  const body = `${params.razorpay_order_id}|${params.razorpay_payment_id}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  // Use timing-safe comparison
  const a = Buffer.from(expectedSignature, 'hex')
  const b = Buffer.from(params.razorpay_signature, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/**
 * Verify a Razorpay webhook signature.
 */
export function verifyRazorpayWebhook(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    console.error('[razorpay] RAZORPAY_WEBHOOK_SECRET not set')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  const a = Buffer.from(expectedSignature, 'hex')
  const b = Buffer.from(signature, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/**
 * Fetch a payment by ID from Razorpay (for verification / reconciliation).
 */
export async function fetchRazorpayPayment(
  paymentId: string
): Promise<any | null> {
  const rzp = getRazorpay()
  if (!rzp) return null

  try {
    return await rzp.payments.fetch(paymentId)
  } catch (e) {
    console.error('[razorpay] fetch payment failed:', e)
    return null
  }
}

/**
 * Initiate a refund for a payment.
 */
export async function refundRazorpayPayment(params: {
  paymentId: string
  amount?: number  // partial refund if specified, else full
  notes?: Record<string, string>
}): Promise<{ success: boolean; refundId?: string; error?: string }> {
  const rzp = getRazorpay()
  if (!rzp) return { success: false, error: 'Razorpay not configured' }

  try {
    const refund = await rzp.payments.refund(params.paymentId, {
      ...(params.amount ? { amount: Math.round(params.amount * 100) } : {}),
      notes: params.notes || {},
    })
    return { success: true, refundId: refund.id }
  } catch (e: any) {
    console.error('[razorpay] refund failed:', e)
    return { success: false, error: e?.message }
  }
}

/* ------------------------------------------------------------------ */
/*  Stripe (alternative) — minimal scaffold                            */
/* ------------------------------------------------------------------ */
//
// If you prefer Stripe, install it: `bun add stripe`
// Then add env: STRIPE_SECRET_KEY=sk_test_xxx, STRIPE_WEBHOOK_SECRET=whsec_xxx
//
// import Stripe from 'stripe'
// export function getStripe(): Stripe | null {
//   const key = process.env.STRIPE_SECRET_KEY
//   if (!key) return null
//   return new Stripe(key, { apiVersion: '2024-06-20' })
// }
//
// export async function createStripePaymentIntent(params: {
//   amount: number  // in INR
//   currency?: string
//   metadata?: Record<string, string>
// }) {
//   const stripe = getStripe()
//   if (!stripe) return { success: false, error: 'Stripe not configured' }
//   try {
//     const intent = await stripe.paymentIntents.create({
//       amount: Math.round(params.amount * 100),
//       currency: params.currency || 'inr',
//       metadata: params.metadata || {},
//     })
//     return { success: true, clientSecret: intent.client_secret, id: intent.id }
//   } catch (e: any) {
//     return { success: false, error: e?.message }
//   }
// }
