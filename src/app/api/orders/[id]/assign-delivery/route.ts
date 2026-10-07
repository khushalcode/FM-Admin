/**
 * POST /api/orders/[id]/assign-delivery
 * Assign a delivery man to an order (admin/vendor only).
 *
 * Body:
 *   { delivery_man_id }
 *
 * Notifies the delivery man + customer.
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/server/auth'
import { getSupabaseServer } from '@/lib/server/supabase-server'
import { notifyDeliveryAssigned } from '@/lib/server/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseServer()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const { id } = await params
    const { delivery_man_id } = await req.json()

    if (!delivery_man_id) {
      return NextResponse.json({ error: 'Missing delivery_man_id' }, { status: 400 })
    }

    // Verify order + permission
    const { data: order } = await supabase
      .from('orders')
      .select(`
        id, order_code, status,
        customer:customers(user_id, full_name),
        store:stores(name, vendor_id),
        vendor:vendors(user_id),
        delivery_address
      `)
      .eq('id', id)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only admin or the order's vendor can assign delivery
    const isVendor = user.dbUser?.role === 'vendor' && order.vendor?.user_id === user.firebase_uid
    const isAdmin = user.dbUser?.role === 'admin'
    if (!isVendor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify delivery man is online + approved
    const { data: deliveryMan } = await supabase
      .from('delivery_men')
      .select('id, user_id, full_name, is_online, is_approved, current_order_id')
      .eq('id', delivery_man_id)
      .single()

    if (!deliveryMan) {
      return NextResponse.json({ error: 'Delivery man not found' }, { status: 404 })
    }
    if (!deliveryMan.is_approved) {
      return NextResponse.json({ error: 'Delivery man not approved' }, { status: 400 })
    }
    if (deliveryMan.current_order_id) {
      return NextResponse.json(
        { error: 'Delivery man is currently on another delivery' },
        { status: 400 }
      )
    }

    // Assign
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        delivery_man_id: delivery_man_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Mark delivery man as busy
    await supabase
      .from('delivery_men')
      .update({ current_order_id: id })
      .eq('id', delivery_man_id)

    // Notify delivery man + customer
    notifyDeliveryAssigned({
      id,
      order_code: order.order_code,
      delivery_man_id: deliveryMan.user_id,
      delivery_man_name: deliveryMan.full_name,
      store_name: order.store?.name,
      customer_name: order.customer?.full_name || 'Customer',
      customer_address: order.delivery_address,
    }).catch((e) => console.error('[assign-delivery] notification failed:', e))

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[assign-delivery] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
