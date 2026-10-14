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
    store: o.store_name,
    subtotal: o.subtotal,
    tax_rate: 5,
    tax_amount: o.tax,
    total: o.total,
    payment_status: o.payment_status,
  }))
  return csvResponse(rows, `tax-${days}d-${Date.now()}.csv`)
}
