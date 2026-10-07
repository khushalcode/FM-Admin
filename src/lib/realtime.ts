/**
 * Supabase Realtime subscriptions for live order tracking.
 *
 * Usage:
 *   const sub = subscribeToOrders((payload) => {
 *     console.log('Order changed:', payload)
 *   })
 *   // later:
 *   sub.unsubscribe()
 */
import { supabase } from '@/lib/supabase'
import type { Order, OrderStatus, Notification } from '@/lib/types'

export type RealtimePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T | null
}

/* ------------------------------------------------------------------ */
/*  Order realtime                                                     */
/* ------------------------------------------------------------------ */

export function subscribeToOrders(
  callback: (payload: RealtimePayload<Order>) => void,
  filter?: { storeId?: string; customerId?: string; deliveryManId?: string; status?: OrderStatus }
) {
  if (!supabase) return { unsubscribe: () => {} }

  let channel = supabase
    .channel('orders-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        ...(filter?.storeId ? { filter: `store_id=eq.${filter.storeId}` } : {}),
      },
      (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as Order,
          old: payload.old as Order,
        })
      }
    )

  if (filter?.customerId) {
    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${filter.customerId}`,
      },
      (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as Order,
          old: payload.old as Order,
        })
      }
    )
  }

  if (filter?.deliveryManId) {
    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `delivery_man_id=eq.${filter.deliveryManId}`,
      },
      (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as Order,
          old: payload.old as Order,
        })
      }
    )
  }

  channel.subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Order status history realtime                                      */
/* ------------------------------------------------------------------ */

export function subscribeToOrderStatusHistory(
  orderId: string,
  callback: (payload: RealtimePayload<any>) => void
) {
  if (!supabase) return { unsubscribe: () => {} }

  const channel = supabase
    .channel(`order-${orderId}-history`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_status_history',
        filter: `order_id=eq.${orderId}`,
      },
      (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
        })
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Notifications realtime                                             */
/* ------------------------------------------------------------------ */

export function subscribeToNotifications(
  userId: string,
  callback: (payload: RealtimePayload<Notification>) => void
) {
  if (!supabase) return { unsubscribe: () => {} }

  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as Notification,
          old: payload.old as Notification,
        })
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Delivery man location realtime                                     */
/* ------------------------------------------------------------------ */

export function subscribeToDeliveryManLocation(
  deliveryManId: string,
  callback: (location: { latitude: number; longitude: number }) => void
) {
  if (!supabase) return { unsubscribe: () => {} }

  const channel = supabase
    .channel(`delivery-man-${deliveryManId}-location`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_men',
        filter: `id=eq.${deliveryManId}`,
      },
      (payload: any) => {
        if (payload.new?.location) {
          // location is a geography(point) — extract lat/lng
          const loc = payload.new.location
          // Postgis returns "{lat,lng}" or WKT
          callback({ latitude: loc.y ?? loc.lat, longitude: loc.x ?? loc.lng })
        }
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Chat messages realtime                                             */
/* ------------------------------------------------------------------ */

export function subscribeToChatMessages(
  conversationId: string,
  callback: (payload: RealtimePayload<any>) => void
) {
  if (!supabase) return { unsubscribe: () => {} }

  const channel = supabase
    .channel(`chat-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
        })
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Cart realtime (for live cart sync across devices)                  */
/* ------------------------------------------------------------------ */

export function subscribeToCart(
  customerId: string,
  callback: (payload: RealtimePayload<any>) => void
) {
  if (!supabase) return { unsubscribe: () => {} }

  const channel = supabase
    .channel(`cart-${customerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cart_items',
        filter: `customer_id=eq.${customerId}`,
      },
      (payload: any) => {
        callback({
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
        })
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Connection status                                                  */
/* ------------------------------------------------------------------ */

export function onRealtimeConnectionChange(
  callback: (status: 'connected' | 'disconnected' | 'connecting') => void
) {
  if (!supabase) return () => {}
  const channel = supabase.channel('connection-status')
  channel
    .on('system', { event: '*' }, (payload: any) => {
      const state = payload?.state
      if (state === 'joined') callback('connected')
      else if (state === 'closed' || state === 'error') callback('disconnected')
      else callback('connecting')
    })
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
