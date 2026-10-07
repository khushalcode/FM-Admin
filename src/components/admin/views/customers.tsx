'use client'

import { useState, useMemo } from 'react'
import { Users, Plus, Edit, Trash2, Wallet, ShoppingBag, Ban, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, SearchInput, EmptyState, StatusBadge, FilterChips,
  PrimaryButton, IconButton, ConfirmButton, Modal,
  formatCurrency, formatNumber, timeAgo,
} from '../shared'
import { Modal as Modal2 } from '../shared'
import { useAdminState, customerActions } from '@/lib/admin-data'
import { Customer } from '@/lib/types'
import { CustomerModal, WalletDetailModal } from '../crud/modals'
import { OrderDetailModal } from '../crud/order-detail-modal'
import { toast } from 'sonner'

export function CustomersView() {
  const customers = useAdminState((s) => s.customers)
  const orders = useAdminState((s) => s.orders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'has' | 'none'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [wallet, setWallet] = useState<Customer | null>(null)
  const [viewingOrders, setViewingOrders] = useState<Customer | null>(null)

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (statusFilter === 'active' && c.is_blocked) return false
      if (statusFilter === 'blocked' && !c.is_blocked) return false
      const custOrders = orders.filter((o) => o.customer_id === c.id)
      if (ordersFilter === 'has' && custOrders.length === 0) return false
      if (ordersFilter === 'none' && custOrders.length > 0) return false
      if (search) {
        const q = search.toLowerCase()
        return c.full_name.toLowerCase().includes(q) || c.email.includes(q) || c.phone.includes(q)
      }
      return true
    })
  }, [customers, orders, search, statusFilter, ordersFilter])

  const handleDelete = (c: Customer) => {
    customerActions.remove(c.id)
    toast.success('Customer deleted', { description: c.full_name })
  }

  const handleBlock = (c: Customer) => {
    customerActions.toggleBlock(c.id)
    toast.success(c.is_blocked ? 'Customer unblocked' : 'Customer blocked', { description: c.full_name })
  }

  const handleEdit = (c: Customer) => {
    setEditing(c)
    setAddOpen(true)
  }

  const handleAdd = () => {
    setEditing(null)
    setAddOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${filtered.length} of ${customers.length} customers`}
        actions={
          <PrimaryButton onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Add Customer
          </PrimaryButton>
        }
      />

      <Card className="p-4 mb-4 premium-shadow border-border/50">
        <div className="flex flex-col gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, or phone..."
          />
          <div className="flex flex-wrap gap-3">
            <FilterChips
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'blocked', label: 'Blocked' },
              ]}
            />
            <FilterChips
              value={ordersFilter}
              onChange={setOrdersFilter}
              options={[
                { value: 'all', label: 'All Orders' },
                { value: 'has', label: 'Has Orders' },
                { value: 'none', label: 'No Orders' },
              ]}
            />
          </div>
        </div>
      </Card>

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
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                        {c.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground">Joined {timeAgo(c.created_at)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-foreground">{c.email}</p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setViewingOrders(c)}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ShoppingBag className="h-3 w-3" /> {c.total_orders}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {formatCurrency(c.total_spent)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setWallet(c)}
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
                    >
                      <Wallet className="h-3 w-3" /> {formatCurrency(c.wallet_balance)}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {c.is_blocked ? <StatusBadge status="blocked" /> : <StatusBadge status="active" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton icon={Wallet} onClick={() => setWallet(c)} label="Wallet" tone="primary" />
                      <IconButton icon={Edit} onClick={() => handleEdit(c)} label="Edit" tone="primary" />
                      <IconButton
                        icon={c.is_blocked ? CheckCircle2 : Ban}
                        onClick={() => handleBlock(c)}
                        label={c.is_blocked ? 'Unblock' : 'Block'}
                        tone={c.is_blocked ? 'primary' : 'danger'}
                      />
                      <ConfirmButton
                        trigger={<IconButton icon={Trash2} label="Delete" tone="danger" />}
                        title="Delete customer?"
                        description={`This will permanently remove ${c.full_name}. This cannot be undone.`}
                        confirmLabel="Delete"
                        onConfirm={() => handleDelete(c)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Try adjusting your filters or add a new customer"
            action={<PrimaryButton onClick={handleAdd}><Plus className="h-4 w-4" /> Add Customer</PrimaryButton>}
          />
        )}
      </Card>

      <CustomerModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditing(null) }}
        editing={editing}
      />
      {wallet && (
        <WalletDetailModal
          open={!!wallet}
          onClose={() => setWallet(null)}
          userId={wallet.id}
          userRole="customer"
          userName={wallet.full_name}
          currentBalance={wallet.wallet_balance}
        />
      )}
      {viewingOrders && (
        <CustomerOrdersModal customer={viewingOrders} onClose={() => setViewingOrders(null)} />
      )}
    </div>
  )
}

function CustomerOrdersModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const orders = useAdminState((s) => s.orders.filter((o) => o.customer_id === customer.id))
  const [selected, setSelected] = useState<typeof orders[number] | null>(null)

  return (
    <>
      <Modal2 open={true} onClose={onClose} title={`Orders — ${customer.full_name}`} description={`${orders.length} orders`} size="lg">
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {orders.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>}
          {orders.map((o) => (
            <div
              key={o.id}
              className="p-3 border border-border rounded-lg hover:bg-muted/40 cursor-pointer flex items-center justify-between"
              onClick={() => setSelected(o)}
            >
              <div>
                <p className="font-medium text-foreground text-sm">{o.order_code}</p>
                <p className="text-xs text-muted-foreground">{o.store_name} · {o.item_count} items</p>
                <p className="text-xs text-muted-foreground">{timeAgo(o.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground text-sm">{formatCurrency(o.total)}</p>
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))}
        </div>
      </Modal2>
      <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
    </>
  )
}

