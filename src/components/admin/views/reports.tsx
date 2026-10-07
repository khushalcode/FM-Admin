'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import {
  PageHeader, ExportButton, FilterChips,
  formatCurrency, formatNumber, formatCompact,
} from '../shared'
import { useAdminState } from '@/lib/admin-data'
import { revenueChart as seedRevenue, aovTrend } from '@/lib/mock-data'

type Tab = 'sales' | 'tax' | 'commission' | 'products' | 'customers'
type Range = 'today' | '7d' | '30d' | '90d'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'sales', label: 'Sales' },
  { id: 'tax', label: 'Tax' },
  { id: 'commission', label: 'Commission' },
  { id: 'products', label: 'Products' },
  { id: 'customers', label: 'Customers' },
]

export function ReportsView() {
  const [tab, setTab] = useState<Tab>('sales')
  const [range, setRange] = useState<Range>('30d')

  const dayCount = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90
  const revenue = seedRevenue.slice(-dayCount)
  const aov = aovTrend.slice(-dayCount)

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate and download detailed reports"
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Range selector */}
      <Card className="p-4 mb-4 premium-shadow border-border/50">
        <FilterChips
          value={range}
          onChange={(v) => setRange(v)}
          options={[
            { value: 'today', label: 'Today' },
            { value: '7d', label: '7 days' },
            { value: '30d', label: '30 days' },
            { value: '90d', label: '90 days' },
          ]}
        />
      </Card>

      {tab === 'sales' && <SalesReport revenue={revenue} aov={aov} range={range} />}
      {tab === 'tax' && <TaxReport range={range} />}
      {tab === 'commission' && <CommissionReport range={range} />}
      {tab === 'products' && <ProductsReport range={range} />}
      {tab === 'customers' && <CustomersReport range={range} />}
    </div>
  )
}

function SalesReport({
  revenue, aov, range,
}: {
  revenue: typeof seedRevenue
  aov: typeof aovTrend
  range: Range
}) {
  const orders = useAdminState((s) => s.orders)
  const totalRevenue = revenue.reduce((s, r) => s + r.total, 0)
  const totalOrders = revenue.length * 8 // mock
  const totalTax = Math.round(totalRevenue * 0.05)
  const totalDiscount = Math.round(totalRevenue * 0.08)

  const rows = revenue.map((r, i) => ({
    date: r.date,
    revenue: r.total,
    orders: Math.round(r.total / 350),
    aov: aov[i]?.aov || 0,
    tax: Math.round(r.total * 0.05),
    discount: Math.round(r.total * 0.08),
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButton rows={rows} filename={`sales-${range}-${Date.now()}.csv`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 premium-shadow border-border/50">
          <p className="text-xs text-muted-foreground">Gross Sales</p>
          <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card className="p-4 premium-shadow border-border/50">
          <p className="text-xs text-muted-foreground">Orders</p>
          <p className="text-xl font-bold text-foreground mt-1">{formatNumber(totalOrders)}</p>
        </Card>
        <Card className="p-4 premium-shadow border-border/50">
          <p className="text-xs text-muted-foreground">Tax Collected</p>
          <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(totalTax)}</p>
        </Card>
        <Card className="p-4 premium-shadow border-border/50">
          <p className="text-xs text-muted-foreground">Discounts</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{formatCurrency(totalDiscount)}</p>
        </Card>
      </div>

      <Card className="p-6 premium-shadow border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-4">Daily Sales</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => `₹${formatCompact(v)}`} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="premium-shadow border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Date</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Revenue</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Orders</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">AOV</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Tax</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Discount</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(-15).reverse().map((r) => (
                <tr key={r.date} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 text-foreground">{r.date}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(r.revenue)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{r.orders}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(r.aov)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(r.tax)}</td>
                  <td className="px-4 py-3 text-right text-rose-600">{formatCurrency(r.discount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function TaxReport({ range }: { range: Range }) {
  const orders = useAdminState((s) => s.orders)
  const rows = orders.slice(0, 50).map((o) => ({
    order_code: o.order_code,
    date: new Date(o.created_at).toLocaleDateString(),
    subtotal: o.subtotal,
    tax_rate: 5,
    tax_amount: o.tax,
    total: o.total,
    payment_status: o.payment_status,
  }))
  const totalTax = rows.reduce((s, r) => s + r.tax_amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButton rows={rows} filename={`tax-${range}-${Date.now()}.csv`} />
      </div>
      <Card className="p-6 premium-shadow border-border/50">
        <p className="text-xs text-muted-foreground">Total Tax Collected (5% GST)</p>
        <p className="text-3xl font-bold text-foreground mt-1">{formatCurrency(totalTax)}</p>
      </Card>
      <Card className="premium-shadow border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Order</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Date</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Subtotal</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Tax Rate</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Tax Amount</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Total</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.order_code} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{r.order_code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-3 text-right text-foreground">{formatCurrency(r.subtotal)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{r.tax_rate}%</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(r.tax_amount)}</td>
                  <td className="px-4 py-3 text-right text-foreground">{formatCurrency(r.total)}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{r.payment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function CommissionReport({ range }: { range: Range }) {
  const stores = useAdminState((s) => s.stores)
  const orders = useAdminState((s) => s.orders)
  const rows = stores.map((s) => {
    const storeOrders = orders.filter((o) => o.store_id === s.id && o.status === 'delivered')
    const revenue = storeOrders.reduce((sum, o) => sum + o.total, 0)
    const commission = Math.round((revenue * s.commission_percentage) / 100)
    return {
      store: s.name,
      vendor_id: s.vendor_id,
      revenue,
      orders: storeOrders.length,
      commission_pct: s.commission_percentage,
      commission_amount: commission,
      net_payout: revenue - commission,
    }
  })
  const totalCommission = rows.reduce((s, r) => s + r.commission_amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButton rows={rows} filename={`commission-${range}-${Date.now()}.csv`} />
      </div>
      <Card className="p-6 premium-shadow border-border/50">
        <p className="text-xs text-muted-foreground">Total Commission Earned</p>
        <p className="text-3xl font-bold text-foreground mt-1">{formatCurrency(totalCommission)}</p>
      </Card>
      <Card className="premium-shadow border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Store</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Revenue</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Orders</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Commission %</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Commission</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Net Payout</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.store} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{r.store}</td>
                  <td className="px-4 py-3 text-right text-foreground">{formatCurrency(r.revenue)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{r.orders}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{r.commission_pct}%</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(r.commission_amount)}</td>
                  <td className="px-4 py-3 text-right text-foreground">{formatCurrency(r.net_payout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function ProductsReport({ range }: { range: Range }) {
  const products = useAdminState((s) => s.products)
  const orders = useAdminState((s) => s.orders)
  const rows = products.map((p) => {
    const sold = orders.reduce((sum, o) => sum + o.items.filter((it) => it.product_id === p.id).reduce((s, it) => s + it.quantity, 0), 0)
    const revenue = sold * (p.discount_price ?? p.price)
    return {
      name: p.name,
      store_id: p.store_id,
      price: p.discount_price ?? p.price,
      stock: p.stock,
      sold,
      revenue,
      rating: p.rating,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButton rows={rows} filename={`products-${range}-${Date.now()}.csv`} />
      </div>
      <Card className="premium-shadow border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Product</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Price</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Stock</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Units Sold</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Revenue</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((r) => (
                <tr key={r.name} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(r.price)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{r.stock}</td>
                  <td className="px-4 py-3 text-right text-foreground">{r.sold}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(r.revenue)}</td>
                  <td className="px-4 py-3 text-right text-amber-600">★ {r.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function CustomersReport({ range }: { range: Range }) {
  const customers = useAdminState((s) => s.customers)
  const rows = customers.map((c) => ({
    name: c.full_name,
    email: c.email,
    phone: c.phone,
    orders: c.total_orders,
    total_spent: c.total_spent,
    wallet_balance: c.wallet_balance,
    loyalty_points: c.loyalty_points,
    joined: new Date(c.created_at).toLocaleDateString(),
    status: c.is_blocked ? 'blocked' : 'active',
  })).sort((a, b) => b.total_spent - a.total_spent)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButton rows={rows} filename={`customers-${range}-${Date.now()}.csv`} />
      </div>
      <Card className="premium-shadow border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Customer</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Contact</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Orders</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Total Spent</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Wallet</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Loyalty</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Joined</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.email} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p>{r.email}</p>
                    <p className="text-xs">{r.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">{r.orders}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(r.total_spent)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(r.wallet_balance)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{r.loyalty_points}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.joined}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
