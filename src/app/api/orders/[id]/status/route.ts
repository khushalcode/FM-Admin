/**
 * POST /api/orders/[id]/status
 * Update the status of an order. Triggers notifications + realtime.
 *
 * Body:
 *   { status, note? }
 *
 * Allowed transitions:
 *   pending    → accepted | rejected | cancelled
 *   accepted   → preparing | cancelled
 *   preparing  → ready | cancelled
 *   ready      → picked_up (by delivery)
 *   picked_up  → on_the_way
 *   on_the_way → delivered
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/server/auth'
import { getSupabaseServer } from '@/lib/server/supabase-server'
import {
  notifyOrderAccepted, notifyOrderPreparing, notifyOrderReady,
  notifyOrderOnTheWay, notifyOrderDelivered, notifyOrderCancelled,
} from '@/lib/server/notifications'

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:    ['accepted', 'rejected', 'cancelled'],
  accepted:   ['preparing', 'cancelled'],
  preparing:  ['ready', 'cancelled'],
  ready:      ['picked_up', 'cancelled'],
  picked_up:  ['on_the_way'],
  on_the_way: ['delivered', 'cancelled'],
}

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
    const { status: newStatus, note } = await req.json()

    if (!newStatus) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    }

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(user_id, full_name),
        store:stores(name, vendor_id),
        vendor:vendors(user_id),
        delivery_man:delivery_men(user_id, full_name)
      `)
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[order.status] || []
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${newStatus}. Allowed: ${allowed.join(', ')}` },
        { status: 400 }
      )
    }

    // Authorization check
    const role = user.dbUser?.role
    const isVendor = role === 'vendor' && order.vendor?.user_id === user.firebase_uid
    const isDelivery = role === 'delivery' && order.delivery_man?.user_id === user.firebase_uid
    const isCustomer = role === 'customer' && order.customer?.user_id === user.firebase_uid
    const isAdmin = role === 'admin'

    if (!isVendor && !isDelivery && !isCustomer && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Role-based transition checks
    if (newStatus === 'accepted' && !isVendor && !isAdmin) {
      return NextResponse.json({ error: 'Only vendor can accept orders' }, { status: 403 })
    }
    if (newStatus === 'picked_up' && !isDelivery && !isAdmin) {
      return NextResponse.json({ error: 'Only delivery man can mark pickup' }, { status: 403 })
    }
    if (newStatus === 'delivered' && !isDelivery && !isAdmin) {
      return NextResponse.json({ error: 'Only delivery man can mark delivered' }, { status: 403 })
    }

    // Update order
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    if (newStatus === 'accepted') updateData.accepted_at = new Date().toISOString()
    if (newStatus === 'picked_up') updateData.picked_up_at = new Date().toISOString()
    if (newStatus === 'delivered') updateData.delivered_at = new Date().toISOString()
    if (newStatus === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
      if (note) updateData.cancel_reason = note
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Insert status history
    await supabase.from('order_status_history').insert({
      order_id: id,
      status: newStatus,
      changed_by: user.dbUser?.id,
      note,
    })

    // Send notifications based on new status
    const customerUserId = order.customer?.user_id
    const vendorUserId = order.vendor?.user_id
    const deliveryManUserId = order.delivery_man?.user_id
    const storeName = order.store?.name

    const notifPromises: Promise<any>[] = []

    if (newStatus === 'accepted' && customerUserId) {
      notifPromises.push(notifyOrderAccepted({
        id, order_code: order.order_code, customer_id: customerUserId,
        store_name: storeName, estimated_time: 30,
      }))
    } else if (newStatus === 'preparing' && customerUserId) {
      notifPromises.push(notifyOrderPreparing({
        id, order_code: order.order_code, customer_id: customerUserId, store_name: storeName,
      }))
    } else if (newStatus === 'ready' && customerUserId) {
      notifPromises.push(notifyOrderReady({
        id, order_code: order.order_code, customer_id: customerUserId, store_name: storeName,
      }))
    } else if (newStatus === 'on_the_way' && customerUserId && order.delivery_man?.full_name) {
      notifPromises.push(notifyOrderOnTheWay({
        id, order_code: order.order_code, customer_id: customerUserId,
        delivery_man_name: order.delivery_man.full_name, estimated_time: 15,
      }))
    } else if (newStatus === 'delivered' && customerUserId) {
      notifPromises.push(notifyOrderDelivered({
        id, order_code: order.order_code, customer_id: customerUserId, total: order.total,
      }))
    } else if (newStatus === 'cancelled') {
      if (customerUserId || vendorUserId) {
        notifPromises.push(notifyOrderCancelled({
          id, order_code: order.order_code,
          customer_id: customerUserId, vendor_id: vendorUserId, reason: note,
        }))
      }
    }

    // Fire notifications in background
    Promise.all(notifPromises).catch((e) =>
      console.error('[order/status] notifications failed:', e)
    )

    return NextResponse.json({ success: true, status: newStatus })
  } catch (e: any) {
    console.error('[order/status] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
