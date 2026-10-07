/**
 * POST /api/payments/razorpay/create-order
 * Create a Razorpay order before payment.
 *
 * Body:
 *   { order_id, amount, currency?, notes? }
 *
 * Returns:
 *   { razorpay_order_id, amount, currency, key_id }
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/server/auth'
import { createRazorpayOrder, isRazorpayConfigured } from '@/lib/server/payments'
import { getSupabaseServer } from '@/lib/server/supabase-server'

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isRazorpayConfigured) {
    return NextResponse.json(
      { error: 'Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' },
      { status: 503 }
    )
  }

  try {
    const { order_id, amount, currency, notes } = await req.json()

    if (!order_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid: order_id, amount' },
        { status: 400 }
      )
    }

    // Verify the order belongs to the user
    const supabase = getSupabaseServer()
    if (supabase && user.dbUser?.role === 'customer') {
      const { data: order } = await supabase
        .from('orders')
        .select('id, customer_id, total, payment_status')
        .eq('id', order_id)
        .single()
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      // Verify ownership via the customers table
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.firebase_uid)
        .single()
      if (!customer || order.customer_id !== customer.id) {
        return NextResponse.json({ error: 'Order does not belong to user' }, { status: 403 })
      }
      if (order.payment_status === 'paid') {
        return NextResponse.json({ error: 'Order already paid' }, { status: 400 })
      }
    }

    const result = await createRazorpayOrder({
      amount,
      currency: currency || 'INR',
      receipt: order_id,
      notes: notes || {},
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Persist the Razorpay order ID
    if (supabase) {
      await supabase.from('payments').insert({
        order_id,
        customer_id: user.dbUser?.id,
        provider: 'razorpay',
        provider_order_id: result.razorpay_order_id,
        amount,
        currency: currency || 'INR',
        status: 'pending',
      })
    }

    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[payments/create-order] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
