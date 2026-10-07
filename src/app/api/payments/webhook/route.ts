/**
 * POST /api/payments/webhook
 * Razorpay webhook handler.
 *
 * Events handled:
 *   - payment.captured    → mark payment as paid
 *   - payment.failed      → mark payment as failed
 *   - refund.processed    → mark payment as refunded
 *
 * Configure webhook URL in Razorpay dashboard:
 *   https://your-domain.com/api/payments/webhook
 *
 * Set RAZORPAY_WEBHOOK_SECRET env var.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpayWebhook } from '@/lib/server/payments'
import { getSupabaseServer } from '@/lib/server/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''

    if (!verifyRazorpayWebhook(rawBody, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event
    const payload = event.payload?.payment?.entity

    if (!payload) {
      return NextResponse.json({ received: true })
    }

    const supabase = getSupabaseServer()
    if (!supabase) {
      return NextResponse.json({ received: true, mode: 'mock' })
    }

    if (eventType === 'payment.captured') {
      await supabase
        .from('payments')
        .update({
          status: 'paid',
          provider_payment_id: payload.id,
          method: payload.method,
          raw_response: event,
          updated_at: new Date().toISOString(),
        })
        .eq('provider_order_id', payload.order_id)

      // Update order payment_status
      await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', payload.receipt)
    } else if (eventType === 'payment.failed') {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          raw_response: event,
          updated_at: new Date().toISOString(),
        })
        .eq('provider_order_id', payload.order_id)
    } else if (eventType === 'refund.processed') {
      await supabase
        .from('payments')
        .update({
          status: 'refunded',
          raw_response: event,
          updated_at: new Date().toISOString(),
        })
        .eq('provider_payment_id', payload.id)
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error('[payments/webhook] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
