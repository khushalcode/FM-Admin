/**
 * POST /api/payments/razorpay/verify
 * Verify a Razorpay payment signature and mark the order as paid.
 *
 * Body:
 *   { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id }
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/server/auth'
import { verifyRazorpaySignature } from '@/lib/server/payments'
import { getSupabaseServer } from '@/lib/server/supabase-server'
import { notifyOrderPlaced } from '@/lib/server/notifications'

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify signature
    const isValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    })

    if (!isValid) {
      // Mark payment as failed
      const supabase = getSupabaseServer()
      if (supabase) {
        await supabase
          .from('payments')
          .update({ status: 'failed', provider_payment_id: razorpay_payment_id })
          .eq('provider_order_id', razorpay_order_id)
      }
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Mark payment as paid
    const supabase = getSupabaseServer()
    if (supabase) {
      await supabase
        .from('payments')
        .update({
          status: 'paid',
          provider_payment_id: razorpay_payment_id,
          updated_at: new Date().toISOString(),
        })
        .eq('provider_order_id', razorpay_order_id)

      // Update order payment status
      await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', order_id)

      // Fetch order details for notification
      const { data: order } = await supabase
        .from('orders')
        .select(`
          id, order_code, store_id, vendor_id, total, module_type,
          customer:customers(full_name)
        `)
        .eq('id', order_id)
        .single()

      if (order) {
        // Fire and forget — don't block payment verification on notifications
        notifyOrderPlaced({
          id: order.id,
          order_code: order.order_code,
          store_id: order.store_id,
          vendor_id: order.vendor_id,
          customer_name: order.customer?.full_name || 'Customer',
          total: order.total,
          module_type: order.module_type,
        }).catch((e) => console.error('[payment-verify] notification failed:', e))
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[payments/verify] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
