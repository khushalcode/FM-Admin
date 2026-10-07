'use client'

import {
  TrendingUp, ShoppingBag, Users, Store, Package, Truck,
  Clock, CheckCircle2, XCircle, Bell, AlertTriangle,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import {
  StatCard, PageHeader, StatusBadge,
  formatCurrency, formatNumber, formatCompact, timeAgo,
} from '../shared'
import { useAdminState } from '@/lib/admin-data'
import { dashboardStats as seedStats, revenueChart as seedRevenue, orderStatusBreakdown as seedStatus, customerGrowth, aovTrend } from '@/lib/mock-data'
import { useMemo } from 'react'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function DashboardView({ onNavigate }: { onNavigate: (view: string) => void }) {
  const orders = useAdminState((s) => s.orders)
  const products = useAdminState((s) => s.products)
  const stores = useAdminState((s) => s.stores)
  const customers = useAdminState((s) => s.customers)
  const vendors = useAdminState((s) => s.vendors)
  const deliveryMen = useAdminState((s) => s.deliveryMen)

  const stats = useMemo(() => {
    const totalRevenue = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0)
    return {
      ...seedStats,
      total_revenue: totalRevenue,
      total_orders: orders.length,
      total_customers: customers.length,
      total_stores: stores.length,
      total_products: products.length,
      total_vendors: vendors.length,
      total_delivery_men: deliveryMen.length,
      pending_orders: orders.filter((o) => o.status === 'pending').length,
      active_orders: orders.filter((o) => ['accepted', 'preparing', 'ready', 'picked_up', 'on_the_way'].includes(o.status)).length,
      cancelled_orders: orders.filter((o) => ['cancelled', 'rejected'].includes(o.status)).length,
      pending_approvals:
        vendors.filter((v) => !v.is_approved).length +
        deliveryMen.filter((d) => !d.is_approved).length,
    }
  }, [orders, customers, stores, products, vendors, deliveryMen])

  const recentOrders = useMemo(() =>
    [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6),
  [orders])

  const lowStockProducts = useMemo(() =>
    products.filter((p) => p.stock < 60).slice(0, 5),
  [products])

  const topStores = useMemo(() =>
    [...stores].sort((a, b) => b.rating - a.rating).slice(0, 5),
  [stores])

  const topProducts = useMemo(() =>
    [...products].sort((a, b) => b.reviews_count - a.reviews_count).slice(0, 10),
  [products])

  // Revenue by day of week
  const revenueByDow = useMemo(() => {
    const buckets: Array<{ day: string; revenue: number }> = DAY_LABELS.map((d) => ({ day: d, revenue: 0 }))
    orders.forEach((o) => {
      if (o.status !== 'delivered') return
      const dow = new Date(o.created_at).getDay()
      buckets[dow].revenue += o.total
    })
    return buckets
  }, [orders])

  const orderBreakdown = useMemo(() => {
    return seedStatus.map((b) => ({ ...b, count: orders.filter((o) => o.status === b.status).length }))
  }, [orders])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of your food delivery platform"
        actions={
          <button
            onClick={() => onNavigate('analytics')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            View Analytics
          </button>
        }
      />

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={formatCurrency(stats.total_revenue)} icon={TrendingUp} change={`+${stats.revenue_change_pct}%`} changeType="up" hint="vs last month" accent="emerald" />
        <StatCard label="Total Orders" value={formatNumber(stats.total_orders)} icon={ShoppingBag} change={`+${stats.orders_change_pct}%`} changeType="up" hint="vs last month" accent="amber" />
        <StatCard label="Customers" value={formatNumber(stats.total_customers)} icon={Users} change={`+${stats.customers_change_pct}%`} changeType="up" hint="vs last month" accent="blue" />
        <StatCard label="Active Stores" value={formatNumber(stats.total_stores)} icon={Store} hint="across the platform" accent="violet" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Products" value={formatNumber(stats.total_products)} icon={Package} accent="emerald" />
        <StatCard label="Vendors" value={formatNumber(stats.total_vendors)} icon={Store} accent="amber" />
        <StatCard label="Delivery Men" value={formatNumber(stats.total_delivery_men)} icon={Truck} accent="blue" />
        <StatCard label="Pending Orders" value={formatNumber(stats.pending_orders)} icon={Clock} accent="rose" />
      </div>

      {/* Pending approvals alert */}
      {stats.pending_approvals > 0 && (
        <Card className="p-4 mb-6 border-amber-200 bg-amber-50 premium-shadow">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                {stats.pending_approvals} pending approval{stats.pending_approvals !== 1 ? 's' : ''} waiting for review
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Vendors and delivery men awaiting your action</p>
            </div>
            <button
              onClick={() => onNavigate('vendors')}
              className="text-xs font-medium text-amber-700 hover:underline"
            >
              Review →
            </button>
          </div>
        </Card>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue trend (30 days) */}
        <Card className="lg:col-span-2 p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-1">Revenue Trend (30 days)</h3>
          <p className="text-xs text-muted-foreground mb-4">Daily revenue across all stores</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={seedRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => `₹${formatCompact(v)}`} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Order status pie */}
        <Card className="p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-1">Order Status</h3>
          <p className="text-xs text-muted-foreground mb-4">Breakdown of all orders</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={orderBreakdown.filter((d) => d.count > 0)} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {orderBreakdown.filter((d) => d.count > 0).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            {orderBreakdown.filter((d) => d.count > 0).map((d) => (
              <div key={d.status} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.label}</span>
                <span className="ml-auto font-medium">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top 10 products */}
        <Card className="p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-1">Top 10 Products</h3>
          <p className="text-xs text-muted-foreground mb-4">By reviews (popularity proxy)</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="reviews_count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top 5 stores */}
        <Card className="p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-1">Top 5 Stores</h3>
          <p className="text-xs text-muted-foreground mb-4">By rating</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topStores} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="rating" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue by day of week */}
        <Card className="p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-1">Revenue by Day of Week</h3>
          <p className="text-xs text-muted-foreground mb-4">Aggregated delivered revenue</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueByDow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => `₹${formatCompact(v)}`} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Customer growth */}
        <Card className="p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-1">Customer Growth</h3>
          <p className="text-xs text-muted-foreground mb-4">Cumulative signups (30 days)</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => formatCompact(v)} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* AOV trend */}
        <Card className="p-6 premium-shadow border-border/50">
          <h3 className="text-base font-semibold text-foreground mb-1">Avg Order Value</h3>
          <p className="text-xs text-muted-foreground mb-4">Daily AOV (30 days)</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={aovTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={(v) => `₹${v}`} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="aov" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent orders + side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <Card className="lg:col-span-2 p-6 premium-shadow border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Recent Orders</h3>
            <button onClick={() => onNavigate('orders')} className="text-xs font-medium text-primary hover:underline">
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onNavigate('orders')}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  🍽️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{o.order_code}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {o.customer_name} · {o.item_count} items · {timeAgo(o.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(o.total)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Side column */}
        <div className="space-y-6">
          {/* Low stock alerts */}
          <Card className="p-6 premium-shadow border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Low Stock</h3>
              <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                {lowStockProducts.length} items
              </span>
            </div>
            <div className="space-y-2">
              {lowStockProducts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">All products well stocked 🎉</p>
              )}
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{stores.find((s) => s.id === p.store_id)?.name}</p>
                  </div>
                  <span className="text-xs font-semibold text-rose-600">{p.stock} left</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
