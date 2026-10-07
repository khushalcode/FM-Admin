'use client'

import { useEffect, useState } from 'react'
import { Modal } from '../shared'
import { GoogleMapEmbed } from './google-map'
import { useAdminState, orderActions, deliveryManActions } from '@/lib/admin-data'
import { DeliveryMan } from '@/lib/types'
import { Wifi, RefreshCw } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Live Map Modal for delivery man tracking                          */
/* ------------------------------------------------------------------ */

export function LiveMapModal({
  open, onClose, man,
}: {
  open: boolean
  onClose: () => void
  man: DeliveryMan
}) {
  const orders = useAdminState((s) => s.orders)
  const stores = useAdminState((s) => s.stores)
  const [tick, setTick] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  // Auto-refresh every 3 seconds (simulated live updates)
  useEffect(() => {
    if (!open) return
    const interval = setInterval(() => {
      setTick((t) => t + 1)
      // Jitter the delivery man's location slightly to simulate movement
      deliveryManActions.update(man.id, {
        latitude: (man.latitude || 12.9716) + (Math.random() - 0.5) * 0.002,
        longitude: (man.longitude || 77.5946) + (Math.random() - 0.5) * 0.002,
      })
      setRefreshing(true)
      setTimeout(() => setRefreshing(false), 500)
    }, 3000)
    return () => clearInterval(interval)
  }, [open, man.id])

  // Re-read latest man state from store
  const liveMan = useAdminState((s) => s.deliveryMen.find((d) => d.id === man.id)) || man
  const currentOrder = liveMan.current_order_id
    ? orders.find((o) => o.id === liveMan.current_order_id)
    : null
  const store = currentOrder ? stores.find((s) => s.id === currentOrder.store_id) : null

  const origin = liveMan.latitude && liveMan.longitude
    ? { lat: liveMan.latitude, lng: liveMan.longitude, label: liveMan.full_name }
    : undefined
  const destination = currentOrder?.delivery_latitude && currentOrder?.delivery_longitude
    ? { lat: currentOrder.delivery_latitude, lng: currentOrder.delivery_longitude, label: 'Customer' }
    : undefined
  const waypoints = store?.latitude && store?.longitude
    ? [{ lat: store.latitude, lng: store.longitude, label: 'Store' }]
    : []

  return (
    <Modal open={open} onClose={onClose} title={`Live Location — ${liveMan.full_name}`} description="Auto-refreshes every 3 seconds" size="xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${liveMan.is_online ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
              <Wifi className="h-3 w-3" />
              {liveMan.is_online ? 'Live' : 'Offline'}
            </span>
            <span className="text-muted-foreground">
              {liveMan.latitude?.toFixed(4)}, {liveMan.longitude?.toFixed(4)}
            </span>
            {refreshing && <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />}
          </div>
          <span className="text-xs text-muted-foreground">Update #{tick}</span>
        </div>

        <GoogleMapEmbed
          origin={origin}
          destination={destination}
          waypoints={waypoints}
          showRoute={!!(origin && destination)}
          height={420}
        />

        {currentOrder && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <p className="font-semibold text-amber-800">Active Order: {currentOrder.order_code}</p>
            <p className="text-amber-700 text-xs mt-0.5">
              {currentOrder.customer_name} · {currentOrder.store_name} · Status: {currentOrder.status.replace(/_/g, ' ')}
            </p>
            <p className="text-amber-700 text-xs mt-0.5">Delivery to: {currentOrder.delivery_address}</p>
          </div>
        )}

        {!currentOrder && (
          <div className="bg-muted/40 border border-border rounded-lg p-3 text-sm text-muted-foreground">
            No active order assigned.
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Close</button>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Store Map Modal — shows store location + delivery area pincodes   */
/* ------------------------------------------------------------------ */

export function StoreMapModal({
  open, onClose, storeId,
}: {
  open: boolean
  onClose: () => void
  storeId: string
}) {
  const store = useAdminState((s) => s.stores.find((x) => x.id === storeId))
  const areas = useAdminState((s) => s.deliveryAreas.filter((d) => d.store_id === storeId))

  if (!store) return null

  const origin = store.latitude && store.longitude
    ? { lat: store.latitude, lng: store.longitude, label: store.name }
    : undefined

  return (
    <Modal open={open} onClose={onClose} title={`Store Location — ${store.name}`} description={store.address} size="xl">
      <div className="space-y-4">
        <GoogleMapEmbed origin={origin} height={400} />

        <div>
          <p className="text-sm font-semibold text-foreground mb-2">Delivery Areas ({areas.length} pincodes)</p>
          <div className="flex flex-wrap gap-2">
            {areas.length === 0 && <p className="text-sm text-muted-foreground">No delivery areas configured.</p>}
            {areas.map((a) => (
              <span key={a.id} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${a.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
                {a.pincode} · ₹{a.delivery_fee} · {a.delivery_time_minutes}m
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Close</button>
        </div>
      </div>
    </Modal>
  )
}
