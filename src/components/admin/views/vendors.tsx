'use client'

import { useState, useMemo } from 'react'
import { Store, Plus, Edit, Trash2, Wallet, ShoppingBag, Check, X, Star, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, SearchInput, EmptyState, StatusBadge, FilterChips,
  PrimaryButton, IconButton, ConfirmButton, Modal,
  formatCurrency, formatNumber, timeAgo,
} from '../shared'
import { useAdminState, vendorActions, storeActions } from '@/lib/admin-data'
import { Vendor } from '@/lib/types'
import { VendorModal, WalletDetailModal } from '../crud/modals'
import { OrderDetailModal } from '../crud/order-detail-modal'
import { toast } from 'sonner'

export function VendorsView() {
  const vendors = useAdminState((s) => s.vendors)
  const stores = useAdminState((s) => s.stores)
  const orders = useAdminState((s) => s.orders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [wallet, setWallet] = useState<Vendor | null>(null)
  const [viewingOrders, setViewingOrders] = useState<Vendor | null>(null)

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (statusFilter === 'approved' && !v.is_approved) return false
      if (statusFilter === 'pending' && v.is_approved) return false
      if (activeFilter === 'active' && !v.is_active) return false
      if (activeFilter === 'inactive' && v.is_active) return false
      if (search) {
        const q = search.toLowerCase()
        return v.full_name.toLowerCase().includes(q) || v.email.includes(q) || v.phone.includes(q)
      }
      return true
    })
  }, [vendors, search, statusFilter, activeFilter])

  const handleDelete = (v: Vendor) => {
    // Also remove their store if it has no orders
    const store = stores.find((s) => s.vendor_id === v.id)
    if (store) {
      const storeOrders = orders.filter((o) => o.store_id === store.id)
      if (storeOrders.length === 0) {
        storeActions.remove(store.id)
      }
    }
    vendorActions.remove(v.id)
    toast.success('Vendor deleted', { description: v.full_name })
  }

  const handleApprove = (v: Vendor) => {
    vendorActions.approve(v.id)
    toast.success('Vendor approved', { description: v.full_name })
  }

  const handleReject = (v: Vendor) => {
    vendorActions.reject(v.id)
    toast.success('Vendor rejected', { description: v.full_name })
  }

  return (
    <div>
      <PageHeader
        title="Vendors"
        subtitle={`${filtered.length} of ${vendors.length} vendors`}
        actions={
          <PrimaryButton onClick={() => { setEditing(null); setAddOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Vendor
          </PrimaryButton>
        }
      />

      <Card className="p-4 mb-4 premium-shadow border-border/50">
        <div className="flex flex-col gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search vendors by name, email, or phone..."
          />
          <div className="flex flex-wrap gap-3">
            <FilterChips
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Approval' },
                { value: 'approved', label: 'Approved' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
            <FilterChips
              value={activeFilter}
              onChange={setActiveFilter}
              options={[
                { value: 'all', label: 'All Activity' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v) => {
          const store = stores.find((s) => s.id === v.store_id || s.vendor_id === v.id)
          return (
            <Card key={v.id} className="p-5 premium-shadow border-border/50 hover:premium-shadow-lg transition-shadow group">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {v.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{v.full_name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{v.email}</p>
                  <p className="text-xs text-muted-foreground">{v.phone}</p>
                </div>
                {v.is_approved ? (
                  <StatusBadge status="approved" />
                ) : (
                  <StatusBadge status="pending" label="Pending" />
                )}
              </div>

              {store && (
                <button
                  onClick={() => toast.info(`Store: ${store.name}`)}
                  className="block w-full text-left bg-muted/50 rounded-lg p-3 mb-3 hover:bg-muted transition-colors"
                >
                  <p className="text-xs text-muted-foreground mb-0.5">Store</p>
                  <p className="text-sm font-medium text-foreground">{store.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{store.address}</p>
                </button>
              )}

              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Sales</p>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(v.total_sales)}</p>
                </div>
                <div className="border-x border-border">
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-sm font-semibold text-foreground">{formatNumber(v.total_orders)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-sm font-semibold text-amber-600 flex items-center justify-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {v.rating}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 pb-3 border-b border-border">
                <span>Joined {timeAgo(v.created_at)}</span>
                <button
                  onClick={() => setWallet(v)}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Wallet className="h-3 w-3" /> {formatCurrency(v.wallet_balance)}
                </button>
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                {!v.is_approved && (
                  <>
                    <button
                      onClick={() => handleApprove(v)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3 w-3" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(v)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <X className="h-3 w-3" /> Reject
                    </button>
                  </>
                )}
                <IconButton icon={ShoppingBag} onClick={() => setViewingOrders(v)} label="Orders" tone="primary" />
                <IconButton icon={Wallet} onClick={() => setWallet(v)} label="Wallet" tone="primary" />
                <IconButton icon={Edit} onClick={() => { setEditing(v); setAddOpen(true) }} label="Edit" tone="primary" />
                <ConfirmButton
                  trigger={<IconButton icon={Trash2} label="Delete" tone="danger" />}
                  title="Delete vendor?"
                  description={`This will remove ${v.full_name}${store ? ' and their store' : ''}.`}
                  onConfirm={() => handleDelete(v)}
                />
              </div>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="premium-shadow border-border/50">
          <EmptyState
            icon={Store}
            title="No vendors found"
            description="Try adjusting your filters or add a new vendor"
          />
        </Card>
      )}

      <VendorModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditing(null) }}
        editing={editing}
      />
      {wallet && (
        <WalletDetailModal
          open={!!wallet}
          onClose={() => setWallet(null)}
          userId={wallet.id}
          userRole="vendor"
          userName={wallet.full_name}
          currentBalance={wallet.wallet_balance}
        />
      )}
      {viewingOrders && (
        <VendorOrdersModal vendor={viewingOrders} onClose={() => setViewingOrders(null)} />
      )}
    </div>
  )
}

function VendorOrdersModal({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const orders = useAdminState((s) => s.orders.filter((o) => o.vendor_id === vendor.id))
  const [selected, setSelected] = useState<typeof orders[number] | null>(null)
  return (
    <>
      <Modal onClose={onClose} open title={`Orders — ${vendor.full_name}`} description={`${orders.length} orders`} size="lg">
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
                <p className="text-xs text-muted-foreground">{o.customer_name} · {o.store_name}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(o.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground text-sm">{formatCurrency(o.total)}</p>
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))}
        </div>
      </Modal>
      <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
    </>
  )
}
