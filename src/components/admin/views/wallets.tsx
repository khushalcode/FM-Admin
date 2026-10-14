'use client'

import { useState, useMemo } from 'react'
import { Wallet, Search, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, SearchInput, EmptyState, StatusBadge, FilterChips,
  PrimaryButton, ExportButton,
  formatCurrency, timeAgo,
} from '../shared'
import { useAdminState, walletActions } from '@/lib/admin-data'
import { WalletDetailModal, WalletAdjustModal } from '../crud/modals'
import { Customer, Vendor, DeliveryMan } from '@/lib/types'

type Role = 'customer' | 'vendor' | 'delivery'

interface WalletRow {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  balance: number
  orders?: number
  sales?: number
  deliveries?: number
}

export function WalletsCustomersView() {
  return <WalletsViewBase role="customer" title="Customer Wallets" />
}
export function WalletsVendorsView() {
  return <WalletsViewBase role="vendor" title="Vendor Wallets" />
}
export function WalletsDeliveryView() {
  return <WalletsViewBase role="delivery" title="Delivery Wallets" />
}

function WalletsViewBase({ role, title }: { role: Role; title: string }) {
  const customers = useAdminState((s) => s.customers)
  const vendors = useAdminState((s) => s.vendors)
  const deliveryMen = useAdminState((s) => s.deliveryMen)
  const txs = useAdminState((s) => walletActions.transactionsByRole(role))
  const [search, setSearch] = useState('')
  const [sortFilter, setSortFilter] = useState<'balance_desc' | 'balance_asc' | 'name'>('balance_desc')
  const [detail, setDetail] = useState<WalletRow | null>(null)
  const [adjust, setAdjust] = useState<WalletRow | null>(null)

  const rows: WalletRow[] = useMemo(() => {
    if (role === 'customer') {
      return customers.map((c) => ({
        id: c.id, name: c.full_name, email: c.email, phone: c.phone,
        role, balance: c.wallet_balance, orders: c.total_orders,
      }))
    }
    if (role === 'vendor') {
      return vendors.map((v) => ({
        id: v.id, name: v.full_name, email: v.email, phone: v.phone,
        role, balance: v.wallet_balance, sales: v.total_sales,
      }))
    }
    return deliveryMen.map((d) => ({
      id: d.id, name: d.full_name, email: d.email, phone: d.phone,
      role, balance: d.wallet_balance, deliveries: d.total_deliveries,
    }))
  }, [role, customers, vendors, deliveryMen])

  const filtered = useMemo(() => {
    return rows
      .filter((r) => {
        if (!search) return true
        const q = search.toLowerCase()
        return r.name.toLowerCase().includes(q) || r.email.includes(q) || r.phone.includes(q)
      })
      .sort((a, b) => {
        if (sortFilter === 'balance_desc') return b.balance - a.balance
        if (sortFilter === 'balance_asc') return a.balance - b.balance
        return a.name.localeCompare(b.name)
      })
  }, [rows, search, sortFilter])

  const totalBalance = filtered.reduce((s, r) => s + r.balance, 0)
  const totalTx = txs.length
  const totalCredit = txs.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
  const totalDebit = txs.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)

  const exportRows = filtered.map((r) => ({
    name: r.name, email: r.email, phone: r.phone, role: r.role,
    balance: r.balance, orders: r.orders ?? '', sales: r.sales ?? '', deliveries: r.deliveries ?? '',
  }))

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${filtered.length} wallets · total balance ${formatCurrency(totalBalance)}`}
        actions={<ExportButton rows={exportRows} filename={`${role}-wallets-${Date.now()}.csv`} />}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 premium-shadow border-border/50">
          <p className="text-xs text-muted-foreground">Total Balance</p>
          <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(totalBalance)}</p>
        </Card>
        <Card className="p-4 premium-shadow border-border/50">
          <p className="text-xs text-muted-foreground">Active Wallets</p>
          <p className="text-xl font-bold text-foreground mt-1">{filtered.length}</p>
        </Card>
        <Card className="p-4 premium-shadow border-border/50">
          <p className="text-xs text-muted-foreground">Total Credits</p>
          <p className="text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> {formatCurrency(totalCredit)}
          </p>
        </Card>
        <Card className="p-4 premium-shadow border-border/50">
          <p className="text-xs text-muted-foreground">Total Debits</p>
          <p className="text-xl font-bold text-rose-600 mt-1 flex items-center gap-1">
            <TrendingDown className="h-4 w-4" /> {formatCurrency(totalDebit)}
          </p>
        </Card>
      </div>

      <Card className="p-4 mb-4 premium-shadow border-border/50">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, or phone..."
            className="flex-1"
          />
          <FilterChips
            value={sortFilter}
            onChange={setSortFilter}
            options={[
              { value: 'balance_desc', label: 'High → Low' },
              { value: 'balance_asc', label: 'Low → High' },
              { value: 'name', label: 'Name A-Z' },
            ]}
          />
        </div>
      </Card>

      <Card className="premium-shadow border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">{role === 'customer' ? 'Customer' : role === 'vendor' ? 'Vendor' : 'Delivery Man'}</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Contact</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">{role === 'customer' ? 'Orders' : role === 'vendor' ? 'Sales' : 'Deliveries'}</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Balance</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                        {r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <p className="font-medium text-foreground">{r.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-foreground">{r.email}</p>
                    <p className="text-xs text-muted-foreground">{r.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {r.orders ?? r.sales ?? r.deliveries ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-foreground">{formatCurrency(r.balance)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDetail(r)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-border hover:bg-muted"
                      >
                        <Wallet className="h-3 w-3" /> Details
                      </button>
                      <button
                        onClick={() => setAdjust(r)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Plus className="h-3 w-3" /> Adjust
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState icon={Wallet} title="No wallets found" description="Try adjusting your search" />
        )}
      </Card>

      {/* Recent transactions */}
      <Card className="mt-6 premium-shadow border-border/50">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {txs.slice(0, 20).map((t) => (
            <div key={t.id} className="p-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-foreground">{t.user_name}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(t.created_at)}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${t.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'credit' ? '+' : '−'} {formatCurrency(t.amount)}
                </p>
                <p className="text-xs text-muted-foreground">Bal: {formatCurrency(t.balance_after)}</p>
              </div>
            </div>
          ))}
          {txs.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">No transactions yet</p>}
        </div>
      </Card>

      {detail && (
        <WalletDetailModal
          open={!!detail}
          onClose={() => setDetail(null)}
          userId={detail.id}
          userRole={detail.role}
          userName={detail.name}
          currentBalance={detail.balance}
        />
      )}
      {adjust && (
        <WalletAdjustModal
          open={!!adjust}
          onClose={() => setAdjust(null)}
          userId={adjust.id}
          userRole={adjust.role}
          userName={adjust.name}
          currentBalance={adjust.balance}
        />
      )}
    </div>
  )
}
