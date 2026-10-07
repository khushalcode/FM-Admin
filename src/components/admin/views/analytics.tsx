'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import {
  PageHeader, StatCard, ExportButton, FilterChips,
  formatCurrency, formatNumber, formatCompact,
} from '../shared'
import {
  TrendingUp, ShoppingBag, Users, Store, Package, Star, Download,
} from 'lucide-react'
import { useAdminState } from '@/lib/admin-data'
import {
  revenueChart as seedRevenue, orderStatusBreakdown as seedStatus,
  customerGrowth, aovTrend,
} from '@/lib/mock-data'

type Range = 'today' | '7d' | '30d' | '90d' | 'custom'

export function AnalyticsView() {
  const orders = useAdminState((s) => s.orders)
  const products = useAdminState((s) => s.products)
  const stores = useAdminState((s) => s.stores)
  const customers = useAdminState((s) => s.customers)
  const [range, setRange] = useState<Range>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const dayCount = useMemo(() => {
    if (range === 'today') return 1
    if (range === '7d') return 7
    if (range === '30d') return 30
    if (range === '90d') return 90
    return 30
  }, [range])

  const revenue = useMemo(() => {
    const slice = seedRevenue.slice(-dayCount)
    return slice
  }, [dayCount])

  const growth = useMemo(() => customerGrowth.slice(-dayCount), [dayCount])
  const aov = useMemo(() => aovTrend.slice(-dayCount), [dayCount])

  // KPIs based on selected range
  const totalRevenue = revenue.reduce((s, r) => s + r.total, 0)
  const totalOrders = Math.max(orders.length, 1) // mock proxy
  const aovValue = totalRevenue / Math.max(dayCount * 8, 1)
  const conversionRate = 12 + (dayCount % 5)

  // Top products
  const topProducts = useMemo(() =>
    [...products].sort((a, b) => b.reviews_count - a.reviews_count).slice(0, 5),
  [products])

  // Top stores
  const topStores = useMemo(() =>
    [...stores].sort((a, b) => b.reviews_count - a.reviews_count).slice(0, 5),
  [stores])

  // Top categories
  const topCategories = useMemo(() => {
    const buckets: Record<string, number> = {}
    orders.forEach((o) => o.items.forEach((it) => {
      const cat = products.find((p) => p.id === it.product_id)
      const catName = cat ? (cat.name.split(' ')[0]) : 'Other'
      buckets[catName] = (buckets[catName] || 0) + it.quantity
    }))
    return Object.entries(buckets)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [orders, products])

  // Conversion funnel
  const funnel = [
    { stage: 'Visitors', value: 15420 },
    { stage: 'Browsed', value: 11280 },
    { stage: 'Added to Cart', value: 5240 },
    { stage: 'Checkout', value: 3180 },
    { stage: 'Ordered', value: 2180 },
    { stage: 'Delivered', value: 1872 },
  ]

  const exportRows = revenue.map((r, i) => ({
    date: r.date,
    revenue: r.total,
    orders: Math.round(r.total / 350),
    aov: aov[i]?.aov || 0,
    new_customers: growth[i]?.total || 0,
  }))

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Deep dive into your platform's performance"
        actions={
          <ExportButton rows={exportRows} filename={`analytics-${range}-${Date.now()}.csv`} label="Download Report" />
        }
      />

      {/* Range selector */}
      <Card className="p-4 mb-6 premium-shadow border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <FilterChips
            value={range}
            onChange={(v) => setRange(v)}
            options={[
              { value: 'today', label: 'Today' },
              { value: '7d', label: '7d' },
              { value: '30d', label: '30d' },
              { value: '90d', label: '90d' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          {range === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background" />
              <span className="text-muted-foreground text-xs">to</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background" />
            </div>
          )}
        </div>
      </Card>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} accent="emerald" />
        <StatCard label="Total Orders" value={formatNumber(totalOrders)} icon={ShoppingBag} accent="amber" />
        <StatCard label="Avg Order Value" value={formatCurrency(Math.round(aovValue))} icon={TrendingUp} accent="blue" />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} icon={Users} accent="violet" />
      </div>

      {/* Revenue + funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-1">Revenue Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Daily revenue · last {dayCount} days</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => `₹${formatCompact(v)}`} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-1">Conversion Funnel</h3>
          <p className="text-xs text-muted-foreground mb-4">Visitor → Delivered</p>
          <div className="space-y-3">
            {funnel.map((f, i) => {
              const pct = (f.value / funnel[0].value) * 100
              return (
                <div key={f.stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{f.stage}</span>
                    <span className="text-muted-foreground">{formatNumber(f.value)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-6 bg-muted rounded-md overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-md" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* AOV + customer growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-1">Avg Order Value Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Daily AOV · last {dayCount} days</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={aov}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => `₹${v}`} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="aov" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-1">Customer Growth</h3>
          <p className="text-xs text-muted-foreground mb-4">Cumulative signups · last {dayCount} days</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => formatCompact(v)} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Order status breakdown */}
      <Card className="p-6 premium-shadow border-border/50 mb-6">
        <h3 className="text-base font-semibold text-foreground mb-1">Order Status Distribution</h3>
        <p className="text-xs text-muted-foreground mb-4">All-time orders by status</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={seedStatus.filter((d) => d.count > 0)} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} width={80} />
            <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {seedStatus.filter((d) => d.count > 0).map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Top categories */}
      <Card className="p-6 premium-shadow border-border/50 mb-6">
        <h3 className="text-base font-semibold text-foreground mb-1">Top Categories</h3>
        <p className="text-xs text-muted-foreground mb-4">By items ordered</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topCategories}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} />
            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Top products + top stores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-sm font-semibold text-muted-foreground w-5">{i + 1}</span>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm">🍽️</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating}
                    </span>
                    <span>· {p.reviews_count} reviews</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(p.discount_price ?? p.price)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-4">Top Stores</h3>
          <div className="space-y-3">
            {topStores.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-sm font-semibold text-muted-foreground w-5">{i + 1}</span>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm">🍽️</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.reviews_count} reviews · {s.delivery_time_minutes} min</p>
                </div>
                <p className="text-sm font-semibold text-amber-600">★ {s.rating}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
