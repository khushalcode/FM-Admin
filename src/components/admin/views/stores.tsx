'use client'

import { useState, useMemo } from 'react'
import { Store as StoreIcon, Plus, Edit, Trash2, MapPin, Phone, Star, Clock, Power, DoorOpen, MapPinned } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, SearchInput, EmptyState, StatusBadge, FilterChips,
  PrimaryButton, IconButton, ConfirmButton, Modal,
  formatCurrency, formatNumber,
} from '../shared'
import { useAdminState, storeActions, deliveryAreaActions } from '@/lib/admin-data'
import { Store, DeliveryArea } from '@/lib/types'
import { StoreModal, DeliveryAreaModal } from '../crud/modals'
import { StoreMapModal } from '../crud/live-map'
import { toast } from 'sonner'

export function StoresView() {
  const stores = useAdminState((s) => s.stores)
  const vendors = useAdminState((s) => s.vendors)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [openFilter, setOpenFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Store | null>(null)
  const [areasFor, setAreasFor] = useState<Store | null>(null)
  const [mapFor, setMapFor] = useState<Store | null>(null)

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      if (activeFilter === 'active' && !s.is_active) return false
      if (activeFilter === 'inactive' && s.is_active) return false
      if (openFilter === 'open' && !s.is_open) return false
      if (openFilter === 'closed' && s.is_open) return false
      if (vendorFilter !== 'all' && s.vendor_id !== vendorFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
      }
      return true
    })
  }, [stores, search, activeFilter, openFilter, vendorFilter])

  const handleDelete = (s: Store) => {
    storeActions.remove(s.id)
    toast.success('Store deleted', { description: s.name })
  }

  const handleToggleActive = (s: Store) => {
    storeActions.toggleActive(s.id)
    toast.success(`Store ${s.is_active ? 'deactivated' : 'activated'}`, { description: s.name })
  }

  const handleToggleOpen = (s: Store) => {
    storeActions.toggleOpen(s.id)
    toast.success(`Store marked ${s.is_open ? 'closed' : 'open'}`, { description: s.name })
  }

  return (
    <div>
      <PageHeader
        title="Stores"
        subtitle={`${filtered.length} of ${stores.length} stores`}
        actions={
          <PrimaryButton onClick={() => { setEditing(null); setAddOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Store
          </PrimaryButton>
        }
      />

      <Card className="p-4 mb-4 premium-shadow border-border/50">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search stores by name or address..."
              className="flex-1"
            />
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="all">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <FilterChips
              value={activeFilter}
              onChange={setActiveFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
            <FilterChips
              value={openFilter}
              onChange={setOpenFilter}
              options={[
                { value: 'all', label: 'All Hours' },
                { value: 'open', label: 'Open Now' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const vendor = vendors.find((v) => v.id === s.vendor_id)
          return (
            <Card key={s.id} className="overflow-hidden premium-shadow border-border/50 hover:premium-shadow-lg transition-shadow group">
              <div className="h-24 flex items-center justify-center relative bg-emerald-50">
                <span className="text-4xl opacity-60">🍽️</span>
                <div className="absolute top-2 right-2 flex gap-1">
                  <StatusBadge status={s.is_open ? 'open' : 'closed'} />
                </div>
                <div className="absolute top-2 left-2">
                  <StatusBadge status={s.is_active ? 'active' : 'inactive'} />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1">{s.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{s.description}</p>

                <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {s.address}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {s.phone}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {s.delivery_time_minutes} min delivery
                  </p>
                  {vendor && (
                    <p className="flex items-center gap-1.5">
                      <StoreIcon className="h-3.5 w-3.5" /> {vendor.full_name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <p className="text-sm font-semibold text-amber-600 flex items-center justify-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {s.rating}
                    </p>
                  </div>
                  <div className="text-center border-x border-border">
                    <p className="text-xs text-muted-foreground">Reviews</p>
                    <p className="text-sm font-semibold text-foreground">{formatNumber(s.reviews_count)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Min Order</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(s.minimum_order)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-wrap pt-3 border-t border-border">
                  <IconButton icon={MapPinned} onClick={() => setAreasFor(s)} label="Delivery Areas" tone="primary" />
                  <IconButton icon={MapPin} onClick={() => setMapFor(s)} label="View on Map" tone="primary" />
                  <IconButton icon={Power} onClick={() => handleToggleActive(s)} label="Toggle Active" tone="primary" />
                  <IconButton icon={DoorOpen} onClick={() => handleToggleOpen(s)} label="Toggle Open" tone="primary" />
                  <IconButton icon={Edit} onClick={() => { setEditing(s); setAddOpen(true) }} label="Edit" tone="primary" />
                  <ConfirmButton
                    trigger={<IconButton icon={Trash2} label="Delete" tone="danger" />}
                    title="Delete store?"
                    description={`This will remove ${s.name} and all its delivery areas.`}
                    onConfirm={() => handleDelete(s)}
                  />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="premium-shadow border-border/50">
          <EmptyState
            icon={StoreIcon}
            title="No stores found"
            description="Try adjusting your filters or add a new store"
          />
        </Card>
      )}

      <StoreModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditing(null) }}
        editing={editing}
      />
      {areasFor && (
        <DeliveryAreasModal store={areasFor} onClose={() => setAreasFor(null)} />
      )}
      {mapFor && (
        <StoreMapModal open={!!mapFor} onClose={() => setMapFor(null)} storeId={mapFor.id} />
      )}
    </div>
  )
}

function DeliveryAreasModal({ store, onClose }: { store: Store; onClose: () => void }) {
  const areas = useAdminState((s) => s.deliveryAreas.filter((d) => d.store_id === store.id))
  const [editing, setEditing] = useState<DeliveryArea | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const handleDelete = (a: DeliveryArea) => {
    deliveryAreaActions.remove(a.id)
    toast.success('Delivery area removed', { description: a.pincode })
  }

  const handleToggle = (a: DeliveryArea) => {
    deliveryAreaActions.update(a.id, { is_active: !a.is_active })
  }

  return (
    <>
      <Modal onClose={onClose} open title={`Delivery Areas — ${store.name}`} description={`${areas.length} pincode-based areas`} size="lg">
        <div className="space-y-3">
          <div className="flex justify-end">
            <PrimaryButton onClick={() => { setEditing(null); setAddOpen(true) }}>
              <Plus className="h-4 w-4" /> Add Area
            </PrimaryButton>
          </div>
          <div className="border border-border rounded-lg divide-y divide-border max-h-[60vh] overflow-y-auto">
            {areas.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground text-center">No delivery areas yet. Add one to start serving pincodes.</p>
            )}
            {areas.map((a) => (
              <div key={a.id} className="p-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-mono font-bold">
                    {a.pincode.slice(-3)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{a.pincode}</p>
                    <p className="text-xs text-muted-foreground">₹{a.delivery_fee} · {a.delivery_time_minutes} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={a.is_active ? 'active' : 'inactive'} />
                  <IconButton icon={Edit} onClick={() => { setEditing(a); setAddOpen(true) }} label="Edit" tone="primary" />
                  <IconButton icon={Power} onClick={() => handleToggle(a)} label="Toggle" tone="primary" />
                  <ConfirmButton
                    trigger={<IconButton icon={Trash2} label="Delete" tone="danger" />}
                    title="Remove delivery area?"
                    description={`Pincode ${a.pincode} will no longer be served.`}
                    onConfirm={() => handleDelete(a)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Close</button>
          </div>
        </div>
      </Modal>
      <DeliveryAreaModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditing(null) }}
        storeId={store.id}
        editing={editing}
      />
    </>
  )
}
