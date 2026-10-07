'use client'

import { useState, useMemo } from 'react'
import { Truck, Plus, Edit, Trash2, Wallet, Bike, Car, Star, Navigation, Check, X, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, SearchInput, EmptyState, StatusBadge, FilterChips,
  PrimaryButton, IconButton, ConfirmButton, Modal,
  formatNumber, timeAgo, formatCurrency,
} from '../shared'
import { useAdminState, deliveryManActions } from '@/lib/admin-data'
import { DeliveryMan } from '@/lib/types'
import { DeliveryManModal, WalletDetailModal } from '../crud/modals'
import { LiveMapModal } from '../crud/live-map'
import { OrderDetailModal } from '../crud/order-detail-modal'
import { toast } from 'sonner'

const VEHICLE_ICONS: Record<string, typeof Bike> = {
  bike: Bike, scooter: Bike, cycle: Bike, car: Car,
}

export function DeliveryMenView() {
  const deliveryMen = useAdminState((s) => s.deliveryMen)
  const [search, setSearch] = useState('')
  const [onlineFilter, setOnlineFilter] = useState<'all' | 'online' | 'offline'>('all')
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'bike' | 'scooter' | 'cycle' | 'car'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<DeliveryMan | null>(null)
  const [wallet, setWallet] = useState<DeliveryMan | null>(null)
  const [liveMap, setLiveMap] = useState<DeliveryMan | null>(null)
  const [viewingDeliveries, setViewingDeliveries] = useState<DeliveryMan | null>(null)

  const filtered = useMemo(() => {
    return deliveryMen.filter((d) => {
      if (onlineFilter === 'online' && !d.is_online) return false
      if (onlineFilter === 'offline' && d.is_online) return false
      if (approvalFilter === 'approved' && !d.is_approved) return false
      if (approvalFilter === 'pending' && d.is_approved) return false
      if (vehicleFilter !== 'all' && d.vehicle_type !== vehicleFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return d.full_name.toLowerCase().includes(q) || d.email.includes(q) || d.phone.includes(q)
      }
      return true
    })
  }, [deliveryMen, search, onlineFilter, approvalFilter, vehicleFilter])

  const handleDelete = (d: DeliveryMan) => {
    deliveryManActions.remove(d.id)
    toast.success('Delivery man deleted', { description: d.full_name })
  }

  const handleApprove = (d: DeliveryMan) => {
    deliveryManActions.approve(d.id)
    toast.success('Delivery man approved', { description: d.full_name })
  }

  const handleReject = (d: DeliveryMan) => {
    deliveryManActions.reject(d.id)
    toast.success('Delivery man rejected', { description: d.full_name })
  }

  return (
    <div>
      <PageHeader
        title="Delivery Men"
        subtitle={`${filtered.length} of ${deliveryMen.length} delivery partners`}
        actions={
          <PrimaryButton onClick={() => { setEditing(null); setAddOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Delivery Man
          </PrimaryButton>
        }
      />

      <Card className="p-4 mb-4 premium-shadow border-border/50">
        <div className="flex flex-col gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search delivery men by name, email, or phone..."
          />
          <div className="flex flex-wrap gap-3">
            <FilterChips
              value={onlineFilter}
              onChange={setOnlineFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'online', label: 'Online' },
                { value: 'offline', label: 'Offline' },
              ]}
            />
            <FilterChips
              value={approvalFilter}
              onChange={setApprovalFilter}
              options={[
                { value: 'all', label: 'All Approval' },
                { value: 'approved', label: 'Approved' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
            <FilterChips
              value={vehicleFilter}
              onChange={setVehicleFilter}
              options={[
                { value: 'all', label: 'All Vehicles' },
                { value: 'bike', label: 'Bike' },
                { value: 'scooter', label: 'Scooter' },
                { value: 'cycle', label: 'Cycle' },
                { value: 'car', label: 'Car' },
              ]}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((d) => {
          const VehicleIcon = VEHICLE_ICONS[d.vehicle_type] || Bike
          return (
            <Card key={d.id} className="p-5 premium-shadow border-border/50 hover:premium-shadow-lg transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {d.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${d.is_online ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{d.full_name}</h3>
                    <p className="text-xs text-muted-foreground">{d.phone}</p>
                  </div>
                </div>
                {!d.is_approved && <StatusBadge status="pending" label="Pending" />}
              </div>

              <div className="space-y-2 mb-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium text-foreground capitalize flex items-center gap-1">
                    <VehicleIcon className="h-3 w-3" /> {d.vehicle_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-medium text-amber-600 flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {d.rating}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deliveries</span>
                  <span className="font-medium text-foreground">{formatNumber(d.total_deliveries)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Wallet</span>
                  <button onClick={() => setWallet(d)} className="font-medium text-primary hover:underline inline-flex items-center gap-1">
                    <Wallet className="h-3 w-3" /> {formatCurrency(d.wallet_balance)}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border mb-2">
                {d.is_approved ? <StatusBadge status="active" /> : <StatusBadge status="inactive" />}
                {d.is_online ? (
                  <span className="text-xs text-emerald-600 font-medium">● Online</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Offline</span>
                )}
              </div>

              {d.current_order_id && (
                <button
                  onClick={() => setLiveMap(d)}
                  className="w-full mt-2 p-2 bg-amber-50 rounded-md flex items-center gap-2 text-xs text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <Navigation className="h-3 w-3 animate-pulse" />
                  <span className="flex-1 text-left">On delivery: {d.current_order_id}</span>
                  <MapPin className="h-3 w-3" /> Live
                </button>
              )}

              <div className="flex items-center gap-1 flex-wrap mt-3">
                {!d.is_approved && (
                  <>
                    <button
                      onClick={() => handleApprove(d)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3 w-3" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(d)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <X className="h-3 w-3" /> Reject
                    </button>
                  </>
                )}
                {d.is_online && (
                  <IconButton icon={MapPin} onClick={() => setLiveMap(d)} label="Live Location" tone="primary" />
                )}
                <IconButton icon={Navigation} onClick={() => setViewingDeliveries(d)} label="Deliveries" tone="primary" />
                <IconButton icon={Wallet} onClick={() => setWallet(d)} label="Wallet" tone="primary" />
                <IconButton icon={Edit} onClick={() => { setEditing(d); setAddOpen(true) }} label="Edit" tone="primary" />
                <ConfirmButton
                  trigger={<IconButton icon={Trash2} label="Delete" tone="danger" />}
                  title="Delete delivery man?"
                  description={`This will remove ${d.full_name}.`}
                  onConfirm={() => handleDelete(d)}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-2 text-center">
                Joined {timeAgo(d.created_at)}
              </p>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="premium-shadow border-border/50">
          <EmptyState
            icon={Truck}
            title="No delivery men found"
            description="Try adjusting your filters or add a new delivery partner"
          />
        </Card>
      )}

      <DeliveryManModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditing(null) }}
        editing={editing}
      />
      {wallet && (
        <WalletDetailModal
          open={!!wallet}
          onClose={() => setWallet(null)}
          userId={wallet.id}
          userRole="delivery"
          userName={wallet.full_name}
          currentBalance={wallet.wallet_balance}
        />
      )}
      {liveMap && (
        <LiveMapModal open={!!liveMap} onClose={() => setLiveMap(null)} man={liveMap} />
      )}
      {viewingDeliveries && (
        <DeliveriesModal man={viewingDeliveries} onClose={() => setViewingDeliveries(null)} />
      )}
    </div>
  )
}

function DeliveriesModal({ man, onClose }: { man: DeliveryMan; onClose: () => void }) {
  const deliveries = useAdminState((s) => s.orders.filter((o) => o.delivery_man_id === man.id))
  const [selected, setSelected] = useState<typeof deliveries[number] | null>(null)
  return (
    <>
      <Modal onClose={onClose} open title={`Deliveries — ${man.full_name}`} description={`${deliveries.length} deliveries`} size="lg">
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {deliveries.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No deliveries yet</p>}
          {deliveries.map((o) => (
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
