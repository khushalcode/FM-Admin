/**
 * FCM push notification helpers — server side.
 *
 * Used by API routes to send push notifications to customers, vendors,
 * and delivery men when orders are placed, accepted, prepared, etc.
 */
import { sendFcmMessage, sendFcmToTopic } from '@/lib/server/firebase-admin'
import { getSupabaseServer } from '@/lib/server/supabase-server'
import type { UserRole, NotificationType } from '@/lib/types'

export interface SendNotificationParams {
  userId?: string  // specific user
  userRole?: UserRole  // broadcast to role
  title: string
  body: string
  type: NotificationType
  data?: Record<string, string>
  imageUrl?: string
}

/**
 * Send a push notification + persist to the notifications table.
 */
export async function sendNotification(params: SendNotificationParams): Promise<{
  success: boolean
  fcmResults?: { successCount: number; failureCount: number }
  error?: string
}> {
  const supabase = getSupabaseServer()

  // 1. Persist to DB
  if (supabase) {
    try {
      await supabase.from('notifications').insert({
        user_id: params.userId,
        user_role: params.userRole,
        title: params.title,
        body: params.body,
        type: params.type,
        data: params.data || {},
        is_read: false,
      })
    } catch (e) {
      console.error('[notifications] failed to persist:', e)
    }
  }

  // 2. Send via FCM
  if (params.userRole && !params.userId) {
    // Broadcast to topic
    const messageId = await sendFcmToTopic({
      topic: `role_${params.userRole}`,
      title: params.title,
      body: params.body,
      data: params.data,
      imageUrl: params.imageUrl,
    })
    return { success: !!messageId }
  }

  if (params.userId) {
    // Send to specific user — fetch their FCM tokens
    let tokens: string[] = []
    if (supabase) {
      // Get the user's FCM token from the users table
      const { data: user } = await supabase
        .from('users')
        .select('fcm_token')
        .eq('id', params.userId)
        .single()
      if (user?.fcm_token) {
        tokens = [user.fcm_token]
      }
    }

    if (tokens.length === 0) {
      // No FCM token — skip push (notification is already in DB)
      return { success: true, fcmResults: { successCount: 0, failureCount: 0 } }
    }

    const results = await sendFcmMessage({
      tokens,
      title: params.title,
      body: params.body,
      data: params.data,
      imageUrl: params.imageUrl,
    })
    return { success: results.successCount > 0, fcmResults: results }
  }

  return { success: false, error: 'No userId or userRole specified' }
}

/* ------------------------------------------------------------------ */
/*  Convenience notification helpers per event                         */
/* ------------------------------------------------------------------ */

export async function notifyOrderPlaced(order: {
  id: string
  order_code: string
  store_id: string
  vendor_id: string
  customer_name: string
  total: number
  module_type: string
}) {
  // Notify vendor
  await sendNotification({
    userId: order.vendor_id,
    title: 'New Order Received 🛍️',
    body: `${order.order_code} from ${order.customer_name} — ₹${order.total}`,
    type: 'order',
    data: {
      order_id: order.id,
      order_code: order.order_code,
      event: 'order_placed',
      module_type: order.module_type,
    },
  })

  // Notify admin
  await sendNotification({
    userRole: 'admin',
    title: 'New Order Placed',
    body: `${order.order_code} — ${order.module_type} order — ₹${order.total}`,
    type: 'order',
    data: {
      order_id: order.id,
      order_code: order.order_code,
      event: 'order_placed',
    },
  })
}

export async function notifyOrderAccepted(order: {
  id: string
  order_code: string
  customer_id: string
  store_name: string
  estimated_time: number
}) {
  await sendNotification({
    userId: order.customer_id,
    title: 'Order Accepted ✅',
    body: `${order.store_name} accepted your order. ETA: ${order.estimated_time} min`,
    type: 'order',
    data: {
      order_id: order.id,
      order_code: order.order_code,
      event: 'order_accepted',
    },
  })
}

export async function notifyOrderPreparing(order: {
  id: string
  order_code: string
  customer_id: string
  store_name: string
}) {
  await sendNotification({
    userId: order.customer_id,
    title: 'Order Being Prepared 👨‍🍳',
    body: `${order.store_name} is preparing your order`,
    type: 'order',
    data: {
      order_id: order.id,
      event: 'order_preparing',
    },
  })
}

export async function notifyOrderReady(order: {
  id: string
  order_code: string
  customer_id: string
  store_name: string
}) {
  await sendNotification({
    userId: order.customer_id,
    title: 'Order Ready for Pickup 📦',
    body: `Your order from ${order.store_name} is ready`,
    type: 'order',
    data: {
      order_id: order.id,
      event: 'order_ready',
    },
  })
}

export async function notifyDeliveryAssigned(order: {
  id: string
  order_code: string
  delivery_man_id: string
  delivery_man_name: string
  store_name: string
  customer_name: string
  customer_address: string
}) {
  // Notify delivery man
  await sendNotification({
    userId: order.delivery_man_id,
    title: 'New Delivery Assigned 🛵',
    body: `Pickup from ${order.store_name} → Deliver to ${order.customer_name}`,
    type: 'order',
    data: {
      order_id: order.id,
      event: 'delivery_assigned',
    },
  })

  // Notify customer
  await sendNotification({
    userId: order.customer_id,
    title: 'Delivery Partner Assigned',
    body: `${order.delivery_man_name} will deliver your order`,
    type: 'order',
    data: {
      order_id: order.id,
      event: 'delivery_assigned',
    },
  })
}

export async function notifyOrderOnTheWay(order: {
  id: string
  order_code: string
  customer_id: string
  delivery_man_name: string
  estimated_time: number
}) {
  await sendNotification({
    userId: order.customer_id,
    title: 'Order On The Way 🛵',
    body: `${order.delivery_man_name} is on the way. ETA: ${order.estimated_time} min`,
    type: 'order',
    data: {
      order_id: order.id,
      event: 'order_on_the_way',
    },
  })
}

export async function notifyOrderDelivered(order: {
  id: string
  order_code: string
  customer_id: string
  total: number
}) {
  await sendNotification({
    userId: order.customer_id,
    title: 'Order Delivered 🎉',
    body: `Your order has been delivered. Total: ₹${order.total}. Rate your experience!`,
    type: 'order',
    data: {
      order_id: order.id,
      event: 'order_delivered',
    },
  })
}

export async function notifyOrderCancelled(order: {
  id: string
  order_code: string
  customer_id: string
  vendor_id: string
  reason?: string
}) {
  await sendNotification({
    userId: order.customer_id,
    title: 'Order Cancelled ❌',
    body: `Your order ${order.order_code} has been cancelled${order.reason ? `: ${order.reason}` : ''}`,
    type: 'order',
    data: { order_id: order.id, event: 'order_cancelled' },
  })
  await sendNotification({
    userId: order.vendor_id,
    title: 'Order Cancelled',
    body: `Order ${order.order_code} has been cancelled`,
    type: 'order',
    data: { order_id: order.id, event: 'order_cancelled' },
  })
}

export async function notifyLowStock(product: {
  id: string
  name: string
  stock: number
  vendor_id: string
  store_name: string
}) {
  await sendNotification({
    userId: product.vendor_id,
    title: 'Low Stock Alert ⚠️',
    body: `${product.name} at ${product.store_name} has only ${product.stock} units left`,
    type: 'system',
    data: { product_id: product.id, event: 'low_stock' },
  })
}

export async function notifyPayoutProcessed(payout: {
  id: string
  user_id: string
  amount: number
  method: string
}) {
  await sendNotification({
    userId: payout.user_id,
    title: 'Payout Processed 💰',
    body: `₹${payout.amount} has been processed via ${payout.method}`,
    type: 'system',
    data: { payout_id: payout.id, event: 'payout_processed' },
  })
}
