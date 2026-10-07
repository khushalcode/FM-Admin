import { NextRequest } from 'next/server'
import { getServerState, csvResponse } from '@/lib/server/admin-store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = Number(searchParams.get('days') || 30)
  const state = getServerState()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const filtered = state.orders.filter((o) => new Date(o.created_at) >= cutoff)
  const rows = filtered.map((o) => ({
    order_code: o.order_code,
    date: new Date(o.created_at).toLocaleDateString(),
    customer: o.customer_name,
    phone: o.customer_phone,
    store: o.store_name,
    items: o.item_count,
    subtotal: o.subtotal,
    delivery_fee: o.delivery_fee,
    discount: o.discount,
    tax: o.tax,
    total: o.total,
    payment_method: o.payment_method,
    payment_status: o.payment_status,
    status: o.status,
  }))
  return csvResponse(rows, `sales-${days}d-${Date.now()}.csv`)
}
