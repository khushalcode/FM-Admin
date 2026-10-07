'use client'

import { useState, useMemo, useEffect } from 'react'
import { ShoppingBag, Eye, Filter, Wifi, WifiOff, Download } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, StatusBadge, SearchInput, EmptyState, FilterChips,
  ExportButton, formatCurrency, timeAgo,
} from '../shared'
import { useAdminState, orderActions, notificationActions } from '@/lib/admin-data'
import { Order, OrderStatus } from '@/lib/types'
import { OrderDetailModal } from '../crud/order-detail-modal'
import { toast } from 'sonner'

const STATUS_FILTERS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'on_the_way', label: 'On The Way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function OrdersView() {
  const orders = useAdminState((s) => s.orders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [live, setLive] = useState(false)

  // Simulated realtime: every 8-12s, nudge a random pending order forward,
  // or insert a brand-new mock order at the top.
  useEffect(() => {
    if (!live) return
    const interval = setInterval(() => {
      const all = orderActions.list()
      const pending = all.filter((o) => ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'on_the_way'].includes(o.status))
      if (pending.length > 0 && Math.random() > 0.4) {
        // advance a random live order
        const o = pending[Math.floor(Math.random() * pending.length)]
        const next: Record<OrderStatus, OrderStatus | null> = {
          pending: 'accepted',
          accepted: 'preparing',
          preparing: 'ready',
          ready: 'picked_up',
          picked_up: 'on_the_way',
          on_the_way: 'delivered',
          delivered: null,
          cancelled: null,
          rejected: null,
        }
        const ns = next[o.status]
        if (ns) {
          orderActions.setStatus(o.id, ns)
          toast.info(`Order ${o.order_code} → ${ns.replace(/_/g, ' ')}`)
        }
      } else {
        // insert a brand-new mock order at the top
        const customers = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy']
        const storeList = orderActions.list().slice(0, 5)
        if (storeList.length === 0) return
        const seed = storeList[Math.floor(Math.random() * storeList.length)]
        const idx = Date.now()
        const newOrder: Order = {
          id: `order_live_${idx}`,
          order_code: `ORD-${2000 + (idx % 1000)}`,
          customer_id: 'cust_live',
          customer_name: customers[Math.floor(Math.random() * customers.length)],
          customer_phone: '+91 98000 00000',
          store_id: seed.store_id,
          store_name: seed.store_name,
          vendor_id: seed.vendor_id,
          delivery_man_id: null,
          items: seed.items,
          item_count: seed.item_count,
          subtotal: seed.subtotal,
          delivery_fee: seed.delivery_fee,
          discount: 0,
          tax: seed.tax,
          total: seed.total,
          payment_method: 'online',
          payment_status: 'paid',
          status: 'pending',
          delivery_address: 'Live Test Address, Bangalore',
          delivery_latitude: 12.9716,
          delivery_longitude: 77.5946,
          created_at: new Date().toISOString(),
        }
        orderActions.addLive(newOrder)
        notificationActions.add({
          title: 'New order received',
          body: `${newOrder.order_code} placed by ${newOrder.customer_name} — ${formatCurrency(newOrder.total)}`,
          type: 'order',
        })
        toast.success('New order arrived!', { description: `${newOrder.order_code} · ${newOrder.customer_name}` })
      }
    }, 9000)
    return () => clearInterval(interval)
  }, [live])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          o.order_code.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.store_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q)
        )
      }
      return true
    })
  }, [orders, search, statusFilter])

  const exportRows = filtered.map((o) => ({
    code: o.order_code,
    customer: o.customer_name,
    phone: o.customer_phone,
    store: o.store_name,
    items: o.item_count,
    total: o.total,
    payment: o.payment_method,
    payment_status: o.payment_status,
    status: o.status,
    placed: new Date(o.created_at).toISOString(),
  }))

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${filtered.length} of ${orders.length} orders`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLive(!live)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors ${
                live
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {live ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {live ? 'Live' : 'Go Live'}
            </button>
            <ExportButton rows={exportRows} filename={`orders-${Date.now()}.csv`} />
          </div>
        }
      />

      <Card className="p-4 mb-4 premium-shadow border-border/50">
        <div className="flex flex-col gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by order code, customer, store, phone..."
          />
          <FilterChips
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTERS.map((f) => ({
              value: f.value,
              label: f.label,
              count: f.value === 'all' ? orders.length : orders.filter((o) => o.status === f.value).length,
            }))}
          />
        </div>
      </Card>

      <Card className="premium-shadow border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Order</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Customer</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Store</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Items</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Total</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Payment</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Time</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelected(o)}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {o.order_code}
                    {o.id.startsWith('order_live_') && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        <Wifi className="h-2.5 w-2.5" /> LIVE
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-foreground">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{o.store_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.item_count}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {formatCurrency(o.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground capitalize">{o.payment_method}</span>
                    {o.payment_status === 'paid' && (
                      <span className="ml-1 text-xs text-emerald-600">✓</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(o) }}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState
            icon={ShoppingBag}
            title="No orders found"
            description="Try adjusting your filters or search query"
          />
        )}
      </Card>

      <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
