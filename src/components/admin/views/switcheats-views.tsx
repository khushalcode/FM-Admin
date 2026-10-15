'use client'

/**
 * switcheats-views-v2.tsx
 *
 * Enhanced, faithful copy of food-backend-umber admin views.
 * Column structures / action buttons / form fields are mirrored from the
 * food-backend-umber admin JS bundle (Customers-BwEJLabH.js, DeliverymanList,
 * Coupons, AddRestaurant, AddEmployee, AddDeliveryman, AddZone, Bonus,
 * ContactMessages, DeliverySupportTickets, DeliveryWithdrawal, etc.)
 */

import { useState, useMemo } from 'react'
import {
  CreditCard, CheckCircle2, Utensils, FolderTree, MapPin, FileText, Truck,
  Gift, DollarSign, PiggyBank, Phone, MessageSquare, Mail, AlertTriangle,
  Receipt, Megaphone, ImageIcon, Bell, Settings, Zap, UserCog, Globe,
  Plus, Search, X, Filter, Download, Eye, Edit, Trash2, Power, RefreshCw,
  ShoppingCart, Wallet, TrendingUp, Users, Store, Star, ArrowRight,
  Lock, Headset, Circle, ShoppingBag, Building2, ChevronRight, ChevronDown,
  Upload, MapPinned, IndianRupee, Calendar, PhoneCall, User, ImageOff,
} from 'lucide-react'
import {
  PageHeader, StatCard, StatusBadge, SearchInput, EmptyState, FilterChips,
  ExportButton, Modal, Field, SelectField, TextareaField, Toggle,
  PrimaryButton, OutlineButton, IconButton, ConfirmButton,
  ImageUpload, SwButton, SwIconButton, SwCard, SwPageHeader, SwBadge, SwSectionLabel,
  formatCurrency, formatNumber, timeAgo,
} from '../shared'
import { useAdminState, deliveryManActions, notificationActions } from '@/lib/admin-data'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ====================================================================== */
/*  Helpers                                                                */
/* ====================================================================== */

function PlaceholderView({
  title, description, icon: Icon, actions,
}: { title: string; description: string; icon: typeof CreditCard; actions?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={description} actions={actions} />
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-background border border-border flex items-center justify-center mb-4">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      </div>
    </div>
  )
}

// Generic data-table component used by every list view
function DataTable<T extends { id: string }>({
  columns, rows, loading, emptyTitle, emptyDescription, onRowClick, getActions,
}: {
  columns: Array<{ key: string; header: string; render?: (row: T) => React.ReactNode; className?: string }>
  rows: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  getActions?: (row: T) => React.ReactNode
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-background p-8 text-center">
        <RefreshCw className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }
  if (!rows.length) {
    return <EmptyState icon={AlertTriangle} title={emptyTitle || 'No Data Found'} description={emptyDescription} />
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-background">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cn('px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap', c.className)}>
                {c.header}
              </th>
            ))}
            {getActions && <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={cn('hover:bg-muted/30', onRowClick && 'cursor-pointer')}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn('px-4 py-3', c.className)}>
                  {c.render ? c.render(row) : (row as any)[c.key]}
                </td>
              ))}
              {getActions && (
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex gap-1">{getActions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ====================================================================== */
/*  Point of Sale                                                         */
/* ====================================================================== */

export function PointOfSaleView() {
  const products = useAdminState((s) => s.products)
  const stores = useAdminState((s) => s.stores)
  const [cart, setCart] = useState<Array<{ id: string; name: string; price: number; qty: number; image_url?: string }>>([])
  const [storeId, setStoreId] = useState(stores[0]?.id || '')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => products.filter(
    (p) => (!storeId || p.store_id === storeId) && (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  ), [products, storeId, search])

  const addToCart = (p: typeof products[0]) => {
    setCart((c) => {
      const existing = c.find((x) => x.id === p.id)
      if (existing) return c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x))
      return [...c, { id: p.id, name: p.name, price: p.price, qty: 1, image_url: p.image_url }]
    })
    toast.success(`${p.name} added`)
  }

  const total = cart.reduce((s, x) => s + x.price * x.qty, 0)
  const tax = Math.round(total * 0.05)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Point of Sale"
        subtitle="Quick walk-in order checkout"
        actions={<SelectField label="Store" value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products…" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => addToCart(p)} className="text-left rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-colors overflow-hidden">
                <div className="aspect-square bg-muted">{p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}</div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-sm font-bold text-primary mt-0.5">{formatCurrency(p.price)}</p>
                </div>
              </button>
            ))}
            {!filtered.length && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No products for this store.</div>}
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Cart</h3>
              {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-rose-600 hover:underline">Clear</button>}
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {cart.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatCurrency(c.price)} × {c.qty}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCart((s) => s.map((x) => x.id === c.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} className="h-6 w-6 rounded border border-border text-xs">−</button>
                    <span className="w-6 text-center text-xs">{c.qty}</span>
                    <button onClick={() => setCart((s) => s.map((x) => x.id === c.id ? { ...x, qty: x.qty + 1 } : x))} className="h-6 w-6 rounded border border-border text-xs">+</button>
                  </div>
                  <button onClick={() => setCart((s) => s.filter((x) => x.id !== c.id))} className="text-rose-500 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {!cart.length && <p className="text-xs text-muted-foreground text-center py-4">Empty cart</p>}
            </div>
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(total)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Tax (5%)</span><span>{formatCurrency(tax)}</span></div>
              <div className="flex justify-between text-sm font-bold mt-1 pt-1 border-t border-border"><span>Total</span><span>{formatCurrency(total + tax)}</span></div>
            </div>
            <PrimaryButton className="w-full mt-3" disabled={!cart.length} onClick={() => { toast.success('Payment received'); setCart([]) }}>
              <CreditCard className="h-4 w-4" /> Charge & Complete
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ====================================================================== */
/*  Food Approval                                                         */
/* ====================================================================== */

export function FoodApprovalView() {
  const products = useAdminState((s) => s.products)
  const [search, setSearch] = useState('')
  const pending = products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase())).slice(-10).reverse()

  return (
    <div className="space-y-4">
      <SwPageHeader
        title="Food Approval"
        subtitle="Approve or reject foods submitted by restaurants"
        actions={<><SearchInput value={search} onChange={setSearch} placeholder="Search foods…" /><ExportButton rows={pending} filename="food-approval.csv" /></>}
      />
      <DataTable
        columns={[
          { key: 'image', header: 'Image', render: (p: any) => <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">{p.image_url ? <img src={p.image_url} className="h-full w-full object-cover" alt="" /> : <ImageOff className="h-4 w-4 text-slate-400" />}</div> },
          { key: 'name', header: 'Name', render: (p: any) => <span className="font-semibold text-slate-900">{p.name}</span> },
          { key: 'store', header: 'Restaurant', render: () => <span className="text-xs text-slate-600">Spice Garden</span> },
          { key: 'price', header: 'Price', render: (p: any) => <span className="font-bold text-slate-900">{formatCurrency(p.price)}</span> },
          { key: 'is_veg', header: 'Diet', render: (p: any) => <SwBadge color={p.is_veg ? 'green' : 'red'}>{p.is_veg ? 'Veg' : 'Non-Veg'}</SwBadge> },
          { key: 'status', header: 'Status', render: () => <SwBadge color="amber">Pending</SwBadge> },
        ]}
        rows={pending}
        emptyTitle="No foods awaiting approval"
        emptyDescription="All submitted foods have been reviewed."
        getActions={(p: any) => (
          <>
            <SwButton size="sm" variant="success" onClick={() => toast.success(`${p.name} approved`)}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</SwButton>
            <SwButton size="sm" variant="danger" onClick={() => toast.info(`${p.name} rejected`)}>Reject</SwButton>
          </>
        )}
      />
    </div>
  )
}

/* ====================================================================== */
/*  Addons                                                                */
/* ====================================================================== */

const ADDON_SEED = [
  { id: 'ad1', name: 'Extra Cheese', price: 30, store_id: '', is_active: true, image_url: '' },
  { id: 'ad2', name: 'Extra Sauce', price: 15, store_id: '', is_active: true, image_url: '' },
  { id: 'ad3', name: 'Spicy Mix', price: 20, store_id: '', is_active: false, image_url: '' },
  { id: 'ad4', name: 'Onion Rings', price: 50, store_id: '', is_active: true, image_url: '' },
]
const ADDONS_KEY = 'food-munch-addons-v2'
function loadAddons() {
  if (typeof window === 'undefined') return ADDON_SEED
  try { return JSON.parse(localStorage.getItem(ADDONS_KEY) || 'null') || ADDON_SEED } catch { return ADDON_SEED }
}
function saveAddons(items: any[]) { if (typeof window !== 'undefined') localStorage.setItem(ADDONS_KEY, JSON.stringify(items)) }

export function AddonsView() {
  const stores = useAdminState((s) => s.stores)
  const [items, setItems] = useState(loadAddons())
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ open: boolean; editing?: any }>({ open: false })
  const [form, setForm] = useState({ name: '', price: 0, store_id: '', is_active: true, description: '', image_url: '' })

  const filtered = items.filter((a: any) => !search || a.name.toLowerCase().includes(search.toLowerCase()))
  const commit = (next: any[]) => { setItems(next); saveAddons(next) }

  const openCreate = () => { setForm({ name: '', price: 0, store_id: stores[0]?.id || '', is_active: true, description: '', image_url: '' }); setModal({ open: true }) }
  const openEdit = (a: any) => { setForm({ name: a.name, price: a.price, store_id: a.store_id, is_active: a.is_active, description: a.description || '', image_url: a.image_url || '' }); setModal({ open: true, editing: a }) }

  const save = () => {
    if (!form.name.trim()) { toast.error('Name required'); return }
    if (!form.image_url) { toast.error('Add-on image is mandatory — please upload an image'); return }
    if (modal.editing) {
      commit(items.map((x: any) => x.id === modal.editing.id ? { ...x, ...form } : x))
      toast.success('Add-on updated')
    } else {
      commit([{ id: `ad_${Date.now()}`, ...form }, ...items])
      toast.success('Add-on created')
    }
    setModal({ open: false })
  }
  const remove = (id: string) => { commit(items.filter((x: any) => x.id !== id)); toast.info('Add-on removed') }
  const toggle = (id: string) => commit(items.map((x: any) => x.id === id ? { ...x, is_active: !x.is_active } : x))

  return (
    <div className="space-y-4">
      <SwPageHeader
        title="Restaurant add-ons"
        subtitle="Manage global add-ons offered across restaurants"
        actions={<>
          <SearchInput value={search} onChange={setSearch} placeholder="Search add-ons…" />
          <ExportButton rows={filtered} filename="addons.csv" />
          <SwButton onClick={openCreate}><Plus className="h-4 w-4" /> Add New</SwButton>
        </>}
      />
      <DataTable
        columns={[
          { key: 'image', header: 'Image', render: (a: any) => <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">{a.image_url ? <img src={a.image_url} className="h-full w-full object-cover" alt="" /> : <ImageOff className="h-4 w-4 text-slate-400" />}</div> },
          { key: 'name', header: 'Name', render: (a: any) => <span className="font-semibold text-slate-900">{a.name}</span> },
          { key: 'store', header: 'Restaurant', render: (a: any) => <span className="text-xs text-slate-600">{stores.find((s) => s.id === a.store_id)?.name || 'All stores'}</span> },
          { key: 'price', header: 'Price', render: (a: any) => <span className="font-bold text-slate-900">{formatCurrency(a.price)}</span> },
          { key: 'is_active', header: 'Status', render: (a: any) => <SwBadge color={a.is_active ? 'green' : 'slate'}>{a.is_active ? 'Active' : 'Inactive'}</SwBadge> },
        ]}
        rows={filtered}
        emptyTitle="No add-ons found"
        emptyDescription="Create your first add-on to get started."
        getActions={(a: any) => (
          <>
            <SwIconButton icon={Eye} label="View" tone="primary" onClick={() => openEdit(a)} />
            <SwIconButton icon={Edit} label="Edit" tone="primary" onClick={() => openEdit(a)} />
            <SwIconButton icon={Power} label={a.is_active ? 'Disable' : 'Enable'} tone="default" onClick={() => toggle(a.id)} />
            <ConfirmButton trigger={<button type="button" aria-label="Delete" title="Delete" className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></button>} title="Delete add-on?" description={`This will permanently remove ${a.name}. This action cannot be undone.`} onConfirm={() => remove(a.id)} />
          </>
        )}
      />
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.editing ? 'Edit Add-on' : 'Add New Add-on'} size="lg">
        <div className="space-y-4">
          <ImageUpload
            label="Add-on Image"
            value={form.image_url}
            onChange={(v) => setForm({ ...form, image_url: v })}
            required
            description="PNG, JPG, WEBP up to 5MB"
            maxSizeMB={5}
            aspect="square"
          />
          <Field label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Extra Cheese" />
          <Field label="Price (₹) *" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) || 0 })} />
          <SelectField label="Restaurant" value={form.store_id} onChange={(v) => setForm({ ...form, store_id: v })} options={[{ value: '', label: 'All stores' }, ...stores.map((s) => ({ value: s.id, label: s.name }))]} />
          <TextareaField label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={2} />
          <Toggle label="Available" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
            <SwButton variant="outline" onClick={() => setModal({ open: false })}>Cancel</SwButton>
            <SwButton onClick={save}>{modal.editing ? 'Save Changes' : 'Submit'}</SwButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ====================================================================== */
/*  Zone Setup                                                            */
/* ====================================================================== */

const ZONES_SEED = [
  { id: 'z1', name: 'Bengaluru Central', pincode: '560001', delivery_fee: 30, is_active: true, coordinates: '12.9716,77.5946', radius_km: 5 },
  { id: 'z2', name: 'Indiranagar', pincode: '560038', delivery_fee: 35, is_active: true, coordinates: '12.9719,77.6412', radius_km: 4 },
  { id: 'z3', name: 'Koramangala', pincode: '560034', delivery_fee: 25, is_active: true, coordinates: '12.9352,77.6245', radius_km: 3 },
  { id: 'z4', name: 'Whitefield', pincode: '560066', delivery_fee: 45, is_active: false, coordinates: '12.9698,77.7500', radius_km: 7 },
  { id: 'z5', name: 'JP Nagar', pincode: '560078', delivery_fee: 30, is_active: true, coordinates: '12.9082,77.5852', radius_km: 5 },
]
const ZONES_KEY = 'food-munch-zones-v2'
function loadZones() {
  if (typeof window === 'undefined') return ZONES_SEED
  try { return JSON.parse(localStorage.getItem(ZONES_KEY) || 'null') || ZONES_SEED } catch { return ZONES_SEED }
}
function saveZones(z: any[]) { if (typeof window !== 'undefined') localStorage.setItem(ZONES_KEY, JSON.stringify(z)) }

export function ZoneSetupView() {
  const [zones, setZones] = useState(loadZones())
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ open: boolean; editing?: any }>({ open: false })
  const [form, setForm] = useState({ name: '', pincode: '', delivery_fee: 30, is_active: true, coordinates: '', radius_km: 5 })

  const commit = (z: any[]) => { setZones(z); saveZones(z) }
  const filtered = zones.filter((z: any) => !search || z.name.toLowerCase().includes(search.toLowerCase()) || z.pincode.includes(search))

  const openCreate = () => { setForm({ name: '', pincode: '', delivery_fee: 30, is_active: true, coordinates: '', radius_km: 5 }); setModal({ open: true }) }
  const openEdit = (z: any) => { setForm({ name: z.name, pincode: z.pincode, delivery_fee: z.delivery_fee, is_active: z.is_active, coordinates: z.coordinates, radius_km: z.radius_km }); setModal({ open: true, editing: z }) }
  const save = () => {
    if (!form.name || !form.pincode) { toast.error('Name and pincode required'); return }
    if (modal.editing) { commit(zones.map((x: any) => x.id === modal.editing.id ? { ...x, ...form } : x)); toast.success('Zone updated') }
    else { commit([{ id: `z_${Date.now()}`, ...form }, ...zones]); toast.success('Zone created') }
    setModal({ open: false })
  }
  const remove = (id: string) => { commit(zones.filter((x: any) => x.id !== id)); toast.info('Zone removed') }
  const toggle = (id: string) => commit(zones.map((x: any) => x.id === id ? { ...x, is_active: !x.is_active } : x))

  return (
    <div className="space-y-4">
      <PageHeader
        title="Zone Setup"
        subtitle="Define delivery zones with their pincode coverage & fees"
        actions={<>
          <SearchInput value={search} onChange={setSearch} placeholder="Search zones…" />
          <ExportButton rows={filtered} filename="zones.csv" />
          <PrimaryButton onClick={openCreate}><Plus className="h-4 w-4" /> Add Zone</PrimaryButton>
        </>}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((z: any) => (
          <div key={z.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><MapPin className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-sm font-semibold">{z.name}</p>
                  <p className="text-xs text-muted-foreground">Pincode: {z.pincode}</p>
                </div>
              </div>
              <StatusBadge status={z.is_active ? 'active' : 'inactive'} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><p className="text-muted-foreground">Delivery fee</p><p className="font-bold">{formatCurrency(z.delivery_fee)}</p></div>
              <div><p className="text-muted-foreground">Radius</p><p className="font-bold">{z.radius_km} km</p></div>
            </div>
            <div className="mt-2"><p className="text-[10px] text-muted-foreground">Coordinates: {z.coordinates || '—'}</p></div>
            <div className="mt-3 flex gap-1 justify-end">
              <IconButton icon={Eye} label="View" tone="primary" onClick={() => openEdit(z)} />
              <IconButton icon={Edit} label="Edit" tone="primary" onClick={() => openEdit(z)} />
              <IconButton icon={Power} label={z.is_active ? 'Disable' : 'Enable'} onClick={() => toggle(z.id)} />
              <ConfirmButton trigger={<IconButton icon={Trash2} label="Delete" tone="danger" />} title="Delete zone?" description={`This will remove ${z.name} zone.`} onConfirm={() => remove(z.id)} />
            </div>
          </div>
        ))}
        {!filtered.length && <div className="col-span-full"><EmptyState icon={MapPin} title="No zones" /></div>}
      </div>
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.editing ? 'Edit Zone' : 'Add Zone'} size="md">
        <div className="space-y-3">
          <Field label="Zone name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Indiranagar" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pincode" value={form.pincode} onChange={(v) => setForm({ ...form, pincode: v })} placeholder="560038" />
            <Field label="Coordinates (lat,lng)" value={form.coordinates} onChange={(v) => setForm({ ...form, coordinates: v })} placeholder="12.9716,77.5946" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Delivery fee (₹)" type="number" value={String(form.delivery_fee)} onChange={(v) => setForm({ ...form, delivery_fee: Number(v) || 0 })} />
            <Field label="Radius (km)" type="number" value={String(form.radius_km)} onChange={(v) => setForm({ ...form, radius_km: Number(v) || 0 })} />
          </div>
          <Toggle label="Active" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground flex items-center gap-2">
            <MapPinned className="h-4 w-4" />
            <span>Draw Zone on Map feature requires Google Maps API key in Business Setup.</span>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <OutlineButton onClick={() => setModal({ open: false })}>Cancel</OutlineButton>
            <PrimaryButton onClick={save}>{modal.editing ? 'Save Zone' : 'Save Zone'}</PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ====================================================================== */
/*  Restaurant Joining Request                                            */
/* ====================================================================== */

export function RestaurantsJoiningRequestView() {
  const vendors = useAdminState((s) => s.vendors)
  const pending = vendors.filter((v) => !v.is_approved)
  const [search, setSearch] = useState('')
  const filtered = pending.filter((v) => !search || v.full_name.toLowerCase().includes(search.toLowerCase()) || v.email.includes(search))

  return (
    <div className="space-y-4">
      <PageHeader
        title="New Joining Requests"
        subtitle={`${pending.length} restaurant applications pending review`}
        actions={<><SearchInput value={search} onChange={setSearch} placeholder="Search applicants…" /><ExportButton rows={filtered} filename="restaurant-requests.csv" /></>}
      />
      <DataTable
        columns={[
          { key: 'name', header: 'Full name', render: (v: any) => <span className="font-medium">{v.full_name}</span> },
          { key: 'email', header: 'Email address' },
          { key: 'phone', header: 'Phone number' },
          { key: 'created_at', header: 'Submitted', render: (v: any) => <span className="text-xs text-muted-foreground">{timeAgo(v.created_at)}</span> },
          { key: 'status', header: 'Status', render: () => <StatusBadge status="pending" /> },
        ]}
        rows={filtered}
        emptyTitle="No pending applications"
        emptyDescription="All vendor applications have been reviewed."
        getActions={(v: any) => (
          <>
            <IconButton icon={Eye} label="View" tone="primary" />
            <PrimaryButton className="text-xs" onClick={() => { toast.success(`${v.full_name} approved`) }}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</PrimaryButton>
            <OutlineButton className="text-xs text-rose-600" onClick={() => toast.info('Rejected')}>Reject</OutlineButton>
          </>
        )}
      />
    </div>
  )
}

export function RestaurantsUnregisteredView() {
  return <PlaceholderView title="Unregistered Restaurants" description="Restaurants discovered in your zones that have not registered on the platform." icon={Store} actions={<PrimaryButton><Mail className="h-4 w-4" /> Send Invites</PrimaryButton>} />
}

export function RestaurantsReviewsView() {
  const stores = useAdminState((s) => s.stores)
  const reviews = [
    { id: 'rr1', store: stores[0]?.name || 'Restaurant', customer: 'Aarav Sharma', rating: 5, comment: 'Excellent service and great food quality. Highly recommended!', date: '2 hours ago', reply: false },
    { id: 'rr2', store: stores[1]?.name || 'Restaurant', customer: 'Ananya Rao', rating: 4, comment: 'Good experience overall, slight delay in delivery.', date: '5 hours ago', reply: true },
    { id: 'rr3', store: stores[2]?.name || 'Restaurant', customer: 'Vivaan Iyer', rating: 5, comment: 'Best in town! Will order again.', date: '1 day ago', reply: false },
    { id: 'rr4', store: stores[0]?.name || 'Restaurant', customer: 'Diya Pillai', rating: 3, comment: 'Food was cold by the time it arrived.', date: '2 days ago', reply: false },
    { id: 'rr5', store: stores[3]?.name || 'Restaurant', customer: 'Arjun Gupta', rating: 5, comment: 'Amazing service and quick delivery.', date: '3 days ago', reply: true },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Restaurant Reviews" subtitle="Customer feedback for restaurants on the platform" actions={<ExportButton rows={reviews} filename="restaurant-reviews.csv" />} />
      <div className="grid gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{r.store}</p>
                <p className="text-xs text-muted-foreground">by {r.customer} · {r.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">{[1,2,3,4,5].map((i) => <Star key={i} className={cn('h-3 w-3', i <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30')} />)}</div>
                {r.reply && <StatusBadge status="active" label="REPLIED" />}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
            <div className="mt-3 flex gap-2">
              <OutlineButton className="text-xs"><MessageSquare className="h-3.5 w-3.5" /> Reply</OutlineButton>
              <OutlineButton className="text-xs"><Eye className="h-3.5 w-3.5" /> View order</OutlineButton>
              <OutlineButton className="text-xs text-rose-600">Hide</OutlineButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RestaurantsComplaintsView() {
  const complaints = [
    { id: 'c1', store: 'Spice Garden', subject: 'Payment delay', priority: 'high', status: 'open', date: '2h ago' },
    { id: 'c2', store: 'Pizza Corner', subject: 'Commission dispute', priority: 'medium', status: 'in_progress', date: '5h ago' },
    { id: 'c3', store: 'Burger Barn', subject: 'Order refund issue', priority: 'high', status: 'open', date: '1d ago' },
    { id: 'c4', store: 'Tandoori Nights', subject: 'App crash report', priority: 'low', status: 'resolved', date: '2d ago' },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Restaurant Complaints" subtitle="Track and resolve restaurant partner complaints" actions={<ExportButton rows={complaints} filename="restaurant-complaints.csv" />} />
      <DataTable
        columns={[
          { key: 'id', header: 'ID', render: (c) => <span className="font-mono text-xs">#{c.id}</span> },
          { key: 'store', header: 'Restaurant', render: (c) => <span className="font-medium">{c.store}</span> },
          { key: 'subject', header: 'Subject' },
          { key: 'priority', header: 'Priority', render: (c) => <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', c.priority === 'high' ? 'bg-rose-100 text-rose-700' : c.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}>{c.priority}</span> },
          { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
          { key: 'date', header: 'Date', render: (c) => <span className="text-xs text-muted-foreground">{c.date}</span> },
        ]}
        rows={complaints}
        getActions={() => <><IconButton icon={Eye} label="View" tone="primary" /><PrimaryButton className="text-xs">Resolve</PrimaryButton></>}
      />
    </div>
  )
}

export function RestaurantsSettingsView() {
  const [settings, setSettings] = useState({
    autoApprove: false, commissionRate: 10, payoutCycle: 'weekly',
    minPayout: 1000, requireDocuments: true, gstRequired: true,
  })
  const set = (k: string, v: any) => setSettings((s) => ({ ...s, [k]: v }))
  return (
    <div className="space-y-4">
      <PageHeader title="Restaurant Settings" subtitle="Global settings for all restaurants on the platform" />
      <div className="rounded-xl border border-border bg-background p-5 space-y-5 max-w-2xl">
        <Toggle label="Auto-approve new restaurants" desc="Skip manual approval for new restaurant applications" checked={settings.autoApprove} onChange={(v) => set('autoApprove', v)} />
        <Field label="Commission rate (%)" type="number" value={String(settings.commissionRate)} onChange={(v) => set('commissionRate', Number(v) || 0)} />
        <SelectField label="Payout cycle" value={settings.payoutCycle} onChange={(v) => set('payoutCycle', v)} options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} />
        <Field label="Minimum payout amount (₹)" type="number" value={String(settings.minPayout)} onChange={(v) => set('minPayout', Number(v) || 0)} />
        <Toggle label="Require business documents" desc="Restaurants must upload FSSAI, GST, PAN before going live" checked={settings.requireDocuments} onChange={(v) => set('requireDocuments', v)} />
        <Toggle label="GST registration required" desc="Restaurants must be GST registered" checked={settings.gstRequired} onChange={(v) => set('gstRequired', v)} />
        <div className="flex justify-end pt-2"><PrimaryButton onClick={() => toast.success('Settings saved')}><CheckCircle2 className="h-4 w-4" /> Save Settings</PrimaryButton></div>
      </div>
    </div>
  )
}

export function SubscriptionSettingsView() {
  const [plans, setPlans] = useState([
    { id: 'p1', name: 'Starter', price: 999, period: 'month', features: 'Up to 100 orders/mo', is_active: true },
    { id: 'p2', name: 'Growth', price: 2499, period: 'month', features: 'Up to 1000 orders/mo + Analytics', is_active: true },
    { id: 'p3', name: 'Enterprise', price: 4999, period: 'month', features: 'Unlimited orders + Priority support', is_active: false },
  ])
  const toggle = (id: string) => setPlans((p) => p.map((x) => x.id === id ? { ...x, is_active: !x.is_active } : x))
  return (
    <div className="space-y-4">
      <PageHeader title="Subscription Settings" subtitle="Plans offered to restaurants for subscription billing" actions={<PrimaryButton><Plus className="h-4 w-4" /> New Plan</PrimaryButton>} />
      <div className="grid gap-3 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">{p.name}</h3>
              <StatusBadge status={p.is_active ? 'active' : 'inactive'} />
            </div>
            <p className="mt-2 text-3xl font-bold">{formatCurrency(p.price)}<span className="text-xs font-normal text-muted-foreground">/{p.period}</span></p>
            <p className="mt-2 text-xs text-muted-foreground">{p.features}</p>
            <div className="mt-4 flex gap-2">
              <OutlineButton className="flex-1 text-xs"><Edit className="h-3.5 w-3.5" /> Edit</OutlineButton>
              <OutlineButton onClick={() => toggle(p.id)}><Power className="h-3.5 w-3.5" /></OutlineButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SubscriptionBillingView() {
  const bills = [
    { id: 'b1', restaurant: 'Spice Garden', plan: 'Growth', amount: 2499, status: 'paid', date: 'Oct 01, 2025' },
    { id: 'b2', restaurant: 'Pizza Corner', plan: 'Starter', amount: 999, status: 'paid', date: 'Sep 30, 2025' },
    { id: 'b3', restaurant: 'Burger Barn', plan: 'Growth', amount: 2499, status: 'pending', date: 'Oct 15, 2025' },
    { id: 'b4', restaurant: 'Tandoori Nights', plan: 'Enterprise', amount: 4999, status: 'failed', date: 'Oct 10, 2025' },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Subscription Billing" subtitle="Subscription invoices and payments" actions={<ExportButton rows={bills} filename="subscription-billing.csv" />} />
      <DataTable
        columns={[
          { key: 'id', header: 'Bill #', render: (b) => <span className="font-mono text-xs">#{b.id}</span> },
          { key: 'restaurant', header: 'Restaurant', render: (b) => <span className="font-medium">{b.restaurant}</span> },
          { key: 'plan', header: 'Plan' },
          { key: 'amount', header: 'Amount', render: (b) => <span className="font-bold">{formatCurrency(b.amount)}</span> },
          { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
          { key: 'date', header: 'Date', render: (b) => <span className="text-xs text-muted-foreground">{b.date}</span> },
        ]}
        rows={bills}
        getActions={() => <OutlineButton className="text-xs"><Eye className="h-3.5 w-3.5" /> Invoice</OutlineButton>}
      />
    </div>
  )
}

/* ====================================================================== */
/*  Orders by Status                                                      */
/* ====================================================================== */

type OrderSubStatus =
  | 'all' | 'pending' | 'processing' | 'food-on-the-way' | 'delivered'
  | 'canceled' | 'restaurant-cancelled' | 'payment-failed' | 'refunded'
  | 'offline-payments' | 'user-carts'

const STATUS_MAP: Record<OrderSubStatus, string> = {
  'all': 'all', 'pending': 'pending', 'processing': 'preparing',
  'food-on-the-way': 'on_the_way', 'delivered': 'delivered',
  'canceled': 'cancelled', 'restaurant-cancelled': 'cancelled',
  'payment-failed': 'failed', 'refunded': 'refunded',
  'offline-payments': 'all', 'user-carts': 'all',
}

export function OrdersByStatusView({ status }: { status: OrderSubStatus }) {
  const orders = useAdminState((s) => s.orders)
  const mapped = STATUS_MAP[status] || 'all'
  const filtered = useMemo(() => {
    if (status === 'all') return orders
    if (status === 'offline-payments') return orders.filter((o) => (o as any).payment_method === 'cod' || (o as any).payment_method === 'cash')
    if (status === 'user-carts') return orders.filter((o) => (o as any).status === 'pending' && (o as any).payment_status === 'pending').slice(0, 5)
    if (status === 'restaurant-cancelled') return orders.filter((o) => o.status === 'cancelled')
    return orders.filter((o) => o.status === mapped)
  }, [orders, status, mapped])

  const titleMap: Record<OrderSubStatus, string> = {
    'all': 'All Orders', 'pending': 'Pending Orders', 'processing': 'Processing Orders',
    'food-on-the-way': 'Food On The Way', 'delivered': 'Delivered Orders',
    'canceled': 'Cancelled Orders', 'restaurant-cancelled': 'Restaurant Cancelled',
    'payment-failed': 'Payment Failed Orders', 'refunded': 'Refunded Orders',
    'offline-payments': 'Offline Payments', 'user-carts': 'User Carts',
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={titleMap[status]}
        subtitle={`${filtered.length} orders in this view`}
        actions={<ExportButton rows={filtered.map((o) => ({ id: o.id, code: o.order_code, customer: o.customer_name, total: o.total, status: o.status, payment: (o as any).payment_status }))} filename={`${status}-orders.csv`} />}
      />
      <DataTable
        columns={[
          { key: 'order_code', header: 'Order ID', render: (o: any) => <span className="font-mono text-xs font-semibold">{o.order_code}</span> },
          { key: 'customer_name', header: 'Customer', render: (o: any) => <span className="font-medium">{o.customer_name}</span> },
          { key: 'store_name', header: 'Restaurant' },
          { key: 'item_count', header: 'Items', render: (o: any) => <span className="text-xs">{o.item_count} items</span> },
          { key: 'total', header: 'Total', render: (o: any) => <span className="font-bold">{formatCurrency(o.total)}</span> },
          { key: 'payment_status', header: 'Payment', render: (o: any) => <StatusBadge status={(o as any).payment_status || 'paid'} /> },
          { key: 'status', header: 'Status', render: (o: any) => <StatusBadge status={o.status} /> },
          { key: 'createdAt', header: 'Date', render: (o: any) => <span className="text-xs text-muted-foreground">{timeAgo(o.createdAt)}</span> },
        ]}
        rows={filtered.slice(0, 50)}
        emptyTitle="No orders found"
        emptyDescription="There are no orders matching this filter."
        getActions={() => <><IconButton icon={Eye} label="View" tone="primary" /><IconButton icon={Edit} label="Update status" tone="primary" /></>}
      />
    </div>
  )
}

export function OrderDetectDeliveryView() {
  return <PlaceholderView title="Order Detect Delivery" description="Auto-detect delivery partners for incoming orders based on proximity and load." icon={Truck} actions={<PrimaryButton><RefreshCw className="h-4 w-4" /> Run Detection</PrimaryButton>} />
}

export function ReferralSettingsView() {
  const [cfg, setCfg] = useState({ referrerReward: 100, refereeReward: 50, minOrderValue: 200, maxReferrals: 10, isActive: true })
  const set = (k: string, v: any) => setCfg((s) => ({ ...s, [k]: v }))
  return (
    <div className="space-y-4">
      <PageHeader title="Referral Settings" subtitle="Configure referral rewards for customers" />
      <div className="rounded-xl border border-border bg-background p-5 space-y-5 max-w-2xl">
        <Field label="Referrer reward (₹)" type="number" value={String(cfg.referrerReward)} onChange={(v) => set('referrerReward', Number(v) || 0)} />
        <Field label="Referee reward (₹)" type="number" value={String(cfg.refereeReward)} onChange={(v) => set('refereeReward', Number(v) || 0)} />
        <Field label="Minimum order value (₹)" type="number" value={String(cfg.minOrderValue)} onChange={(v) => set('minOrderValue', Number(v) || 0)} />
        <Field label="Max referrals per user" type="number" value={String(cfg.maxReferrals)} onChange={(v) => set('maxReferrals', Number(v) || 0)} />
        <Toggle label="Active" checked={cfg.isActive} onChange={(v) => set('isActive', v)} />
        <div className="flex justify-end pt-2"><PrimaryButton onClick={() => toast.success('Referral settings saved')}><CheckCircle2 className="h-4 w-4" /> Save</PrimaryButton></div>
      </div>
    </div>
  )
}

export function SupportTicketsView() {
  const tickets = [
    { id: 't1', subject: 'Order not delivered', user: 'Rahul Sharma', type: 'user', priority: 'high', status: 'open', date: '2h ago', phone: '+91 7470311228' },
    { id: 't2', subject: 'Refund not received', user: 'Spice Garden', type: 'restaurant', priority: 'medium', status: 'in_progress', date: '5h ago', phone: '+91 80 1234 5678' },
    { id: 't3', subject: 'App crashing on checkout', user: 'Priya Patel', type: 'user', priority: 'high', status: 'open', date: '1d ago', phone: '+91 98765 43210' },
    { id: 't4', subject: 'Cannot withdraw funds', user: 'Pizza Corner', type: 'restaurant', priority: 'medium', status: 'resolved', date: '2d ago', phone: '+91 80 3456 7890' },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Support Tickets" subtitle="Customer & restaurant support tickets" actions={<PrimaryButton><Plus className="h-4 w-4" /> New Ticket</PrimaryButton>} />
      <DataTable
        columns={[
          { key: 'id', header: 'ID', render: (t) => <span className="font-mono text-xs">#{t.id}</span> },
          { key: 'subject', header: 'Subject', render: (t) => <span className="font-medium">{t.subject}</span> },
          { key: 'user', header: 'User' },
          { key: 'phone', header: 'Phone Number' },
          { key: 'type', header: 'Type', render: (t) => <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold', t.type === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>{t.type}</span> },
          { key: 'priority', header: 'Priority', render: (t) => <span className="text-xs font-semibold uppercase">{t.priority}</span> },
          { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
          { key: 'date', header: 'Date', render: (t) => <span className="text-xs text-muted-foreground">{t.date}</span> },
        ]}
        rows={tickets}
        getActions={() => <><IconButton icon={Eye} label="Open" tone="primary" /><OutlineButton className="text-xs">Respond</OutlineButton><OutlineButton className="text-xs">Close</OutlineButton></>}
      />
    </div>
  )
}

export function FeeSettingsView() {
  const [cfg, setCfg] = useState({
    platformFeePercent: 5, deliveryFeeBase: 25, deliveryFeePerKm: 5,
    surgeMultiplier: 1, minDeliveryFee: 15, maxDeliveryFee: 100,
  })
  const set = (k: string, v: any) => setCfg((s) => ({ ...s, [k]: v }))
  return (
    <div className="space-y-4">
      <PageHeader title="Delivery & Platform Fee" subtitle="Configure platform commission and delivery charges" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-background p-5 space-y-4">
          <h3 className="text-sm font-semibold">Platform Fee</h3>
          <Field label="Platform commission (%)" type="number" value={String(cfg.platformFeePercent)} onChange={(v) => set('platformFeePercent', Number(v) || 0)} />
        </div>
        <div className="rounded-xl border border-border bg-background p-5 space-y-4">
          <h3 className="text-sm font-semibold">Delivery Fee</h3>
          <Field label="Base fee (₹)" type="number" value={String(cfg.deliveryFeeBase)} onChange={(v) => set('deliveryFeeBase', Number(v) || 0)} />
          <Field label="Per km charge (₹)" type="number" value={String(cfg.deliveryFeePerKm)} onChange={(v) => set('deliveryFeePerKm', Number(v) || 0)} />
          <Field label="Surge multiplier" type="number" value={String(cfg.surgeMultiplier)} onChange={(v) => set('surgeMultiplier', Number(v) || 1)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min fee (₹)" type="number" value={String(cfg.minDeliveryFee)} onChange={(v) => set('minDeliveryFee', Number(v) || 0)} />
            <Field label="Max fee (₹)" type="number" value={String(cfg.maxDeliveryFee)} onChange={(v) => set('maxDeliveryFee', Number(v) || 0)} />
          </div>
        </div>
      </div>
      <div className="flex justify-end"><PrimaryButton onClick={() => toast.success('Fee settings saved')}><CheckCircle2 className="h-4 w-4" /> Save</PrimaryButton></div>
    </div>
  )
}

export function DeliveryWithdrawalView() {
  const withdrawals = [
    { id: 'w1', partner: 'Rahul Kumar', delivery_id: 'DM-1024', phone: '+91 98200 11111', amount: 3450, status: 'pending', date: '2h ago', bank: 'HDFC ****1234', ifsc: 'HDFC0001234', holder: 'Rahul Kumar' },
    { id: 'w2', partner: 'Amit Singh', delivery_id: 'DM-1031', phone: '+91 98200 22222', amount: 2800, status: 'paid', date: '5h ago', bank: 'ICICI ****5678', ifsc: 'ICIC0005678', holder: 'Amit Singh' },
    { id: 'w3', partner: 'Vijay Patel', delivery_id: 'DM-1045', phone: '+91 98200 33333', amount: 1500, status: 'pending', date: '1d ago', bank: 'SBI ****9012', ifsc: 'SBIN0009012', holder: 'Vijay Patel' },
    { id: 'w4', partner: 'Sunil Yadav', delivery_id: 'DM-1052', phone: '+91 98200 44444', amount: 4200, status: 'rejected', date: '2d ago', bank: 'Axis ****3456', ifsc: 'UTIB0003456', holder: 'Sunil Yadav' },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Delivery Withdrawal" subtitle="Withdrawal requests from delivery partners" actions={<ExportButton rows={withdrawals} filename="delivery-withdrawals.csv" />} />
      <DataTable
        columns={[
          { key: 'id', header: 'ID', render: (w) => <span className="font-mono text-xs">#{w.id}</span> },
          { key: 'partner', header: 'Delivery boy', render: (w) => <span className="font-medium">{w.partner}</span> },
          { key: 'delivery_id', header: 'Delivery ID', render: (w) => <span className="font-mono text-xs">{w.delivery_id}</span> },
          { key: 'phone', header: 'Phone' },
          { key: 'amount', header: 'Amount', render: (w) => <span className="font-bold">{formatCurrency(w.amount)}</span> },
          { key: 'bank', header: 'Bank Account', render: (w) => <div className="text-xs"><div>{w.bank}</div><div className="text-muted-foreground">IFSC: {w.ifsc}</div></div> },
          { key: 'status', header: 'Status', render: (w) => <StatusBadge status={w.status} /> },
          { key: 'date', header: 'Request time', render: (w) => <span className="text-xs text-muted-foreground">{w.date}</span> },
        ]}
        rows={withdrawals}
        getActions={(w) => w.status === 'pending' ? (
          <>
            <PrimaryButton className="text-xs">Approve</PrimaryButton>
            <OutlineButton className="text-xs text-rose-600">Reject</OutlineButton>
          </>
        ) : <IconButton icon={Eye} label="View" tone="primary" />}
      />
    </div>
  )
}

export function DeliveryBoyWalletView() {
  const deliveryMen = useAdminState((s) => s.deliveryMen)
  return (
    <div className="space-y-4">
      <PageHeader title="Delivery boy Wallet" subtitle="Wallet balances of all delivery partners" actions={<ExportButton rows={deliveryMen.map((d) => ({ id: d.id, name: d.full_name, balance: d.wallet_balance, status: d.is_online ? 'online' : 'offline' }))} filename="delivery-wallets.csv" />} />
      <DataTable
        columns={[
          { key: 'name', header: 'Name', render: (d: any) => <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">{d.full_name[0]}</div><span className="font-medium">{d.full_name}</span></div> },
          { key: 'phone', header: 'Phone', render: (d: any) => <span className="text-xs">{d.phone}</span> },
          { key: 'wallet_balance', header: 'Pocket balance', render: (d: any) => <span className="font-bold">{formatCurrency(d.wallet_balance)}</span> },
          { key: 'cash_collected', header: 'Cash collected', render: () => <span className="text-xs">₹0</span> },
          { key: 'total_earning', header: 'Total earning', render: () => <span className="text-xs">{formatCurrency(8000)}</span> },
          { key: 'bonus', header: 'Bonus', render: () => <span className="text-xs text-emerald-600">₹200</span> },
          { key: 'total_withdrawal', header: 'Total withdrawal', render: () => <span className="text-xs">₹0</span> },
          { key: 'cash_in_hand', header: 'Cash in hand', render: () => <span className="text-xs">₹0</span> },
          { key: 'status', header: 'Status', render: (d: any) => <StatusBadge status={d.is_online ? 'active' : 'inactive'} /> },
        ]}
        rows={deliveryMen}
        getActions={() => <><IconButton icon={Wallet} label="Adjust" tone="primary" /><IconButton icon={Eye} label="History" /></>}
      />
    </div>
  )
}

export function DeliveryEmergencyHelpView() {
  const alerts = [
    { id: 'e1', partner: 'Rahul Kumar', phone: '+91 98200 11111', type: 'Accident', location: 'MG Road', time: '2h ago', status: 'open' },
    { id: 'e2', partner: 'Amit Singh', phone: '+91 98200 22222', type: 'Vehicle Breakdown', location: 'Indiranagar', time: '5h ago', status: 'resolved' },
    { id: 'e3', partner: 'Vijay Patel', phone: '+91 98200 33333', type: 'Harassment', location: 'Koramangala', time: '1d ago', status: 'open' },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Delivery Emergency Help" subtitle="SOS alerts from delivery partners" actions={<PrimaryButton className="bg-rose-600 hover:bg-rose-700"><Phone className="h-4 w-4" /> Emergency Call</PrimaryButton>} />
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 mb-3">
        <p className="text-xs text-amber-800"><strong>Important Information:</strong> Emergency alerts are sent in real-time. Use the Call button to immediately reach the delivery partner. Resolve alerts once the situation is handled.</p>
      </div>
      <div className="grid gap-3">
        {alerts.map((a) => (
          <div key={a.id} className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-rose-600" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{a.partner} — {a.type}</p>
              <p className="text-xs text-muted-foreground">📞 {a.phone} · 📍 {a.location} · {a.time}</p>
            </div>
            <StatusBadge status={a.status} />
            <div className="flex gap-2">
              <PrimaryButton className="text-xs bg-rose-600 hover:bg-rose-700"><PhoneCall className="h-3.5 w-3.5" /> Call</PrimaryButton>
              <OutlineButton className="text-xs">Resolve</OutlineButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DeliverySupportTicketsView() {
  const tickets = [
    { id: 'dt1', partner: 'Rahul Kumar', phone: '+91 98200 11111', category: 'Payment', description: 'Payment not received for order #1024', priority: 'High', status: 'open', created: '2h ago' },
    { id: 'dt2', partner: 'Amit Singh', phone: '+91 98200 22222', category: 'Technical', description: 'App GPS issue in Indiranagar area', priority: 'Medium', status: 'in_progress', created: '5h ago' },
    { id: 'dt3', partner: 'Sunil Yadav', phone: '+91 98200 44444', category: 'Order', description: 'Order assignment problem', priority: 'Low', status: 'resolved', created: '1d ago' },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Delivery Support Tickets" subtitle="Tickets raised by delivery partners" actions={<ExportButton rows={tickets} filename="delivery-support-tickets.csv" />} />
      <div className="flex flex-wrap gap-2 mb-3">
        <SelectField label="Priority" value="all" onChange={() => {}} options={[{ value: 'all', label: 'All Priority' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
        <SelectField label="Status" value="all" onChange={() => {}} options={[{ value: 'all', label: 'All Status' }, { value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' }]} />
      </div>
      <DataTable
        columns={[
          { key: 'id', header: 'ID', render: (t) => <span className="font-mono text-xs">#{t.id}</span> },
          { key: 'partner', header: 'Delivery Partner', render: (t) => <span className="font-medium">{t.partner}</span> },
          { key: 'phone', header: 'Phone Number' },
          { key: 'category', header: 'Category' },
          { key: 'description', header: 'Description / Issue', render: (t) => <span className="text-xs text-muted-foreground max-w-xs block truncate">{t.description}</span> },
          { key: 'priority', header: 'Priority', render: (t) => <span className={cn('text-xs font-semibold uppercase', t.priority === 'High' ? 'text-rose-600' : t.priority === 'Medium' ? 'text-amber-600' : 'text-blue-600')}>{t.priority}</span> },
          { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
          { key: 'created', header: 'Created', render: (t) => <span className="text-xs text-muted-foreground">{t.created}</span> },
        ]}
        rows={tickets}
        getActions={() => <><IconButton icon={Eye} label="View" tone="primary" /><OutlineButton className="text-xs">Respond</OutlineButton><PrimaryButton className="text-xs">Resolve</PrimaryButton></>}
      />
    </div>
  )
}

export function DeliveryOrderReassignmentRequestsView() {
  const reqs = [
    { id: 'r1', partner: 'Rahul Kumar', order: 'ORD-1024', reason: 'Vehicle breakdown', status: 'pending', date: '2h ago' },
    { id: 'r2', partner: 'Amit Singh', order: 'ORD-1031', reason: 'Customer unreachable', status: 'approved', date: '5h ago' },
    { id: 'r3', partner: 'Vijay Patel', order: 'ORD-1045', reason: 'Personal emergency', status: 'pending', date: '1d ago' },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Order Reassignment Requests" subtitle="Requests from delivery partners to reassign orders" actions={<ExportButton rows={reqs} filename="reassignment-requests.csv" />} />
      <div className="grid gap-3">
        {reqs.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-background p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{r.partner} · <span className="font-mono text-xs">{r.order}</span></p>
              <p className="text-xs text-muted-foreground">{r.reason} · {r.date}</p>
            </div>
            <StatusBadge status={r.status} />
            {r.status === 'pending' && (
              <div className="flex gap-2">
                <PrimaryButton className="text-xs"><RefreshCw className="h-3.5 w-3.5" /> Reassign</PrimaryButton>
                <OutlineButton className="text-xs">Deny</OutlineButton>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DeliveryPartnersJoinRequestView() {
  const deliveryMen = useAdminState((s) => s.deliveryMen)
  const pending = deliveryMen.filter((d) => !d.is_approved)
  return (
    <div className="space-y-4">
      <PageHeader title="New Join Requests" subtitle={`${pending.length} delivery partner applications pending`} actions={<ExportButton rows={pending} filename="delivery-join-requests.csv" />} />
      <DataTable
        columns={[
          { key: 'name', header: 'Name', render: (d: any) => <span className="font-medium">{d.full_name}</span> },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Phone' },
          { key: 'vehicle_type', header: 'Vehicle', render: (d: any) => <span className="text-xs capitalize">{d.vehicle_type}</span> },
          { key: 'status', header: 'Status', render: () => <StatusBadge status="pending" /> },
          { key: 'created_at', header: 'Applied', render: (d: any) => <span className="text-xs text-muted-foreground">{timeAgo(d.created_at)}</span> },
        ]}
        rows={pending}
        emptyTitle="No pending applications"
        getActions={(d: any) => (
          <>
            <IconButton icon={Eye} label="View" tone="primary" />
            <PrimaryButton className="text-xs" onClick={() => { deliveryManActions.approve(d.id); toast.success('Partner approved') }}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</PrimaryButton>
            <OutlineButton className="text-xs text-rose-600" onClick={() => { deliveryManActions.reject(d.id); toast.info('Partner rejected') }}>Reject</OutlineButton>
          </>
        )}
      />
    </div>
  )
}

export function DeliveryPartnersReviewsView() {
  const reviews = [
    { id: 'dr1', partner: 'Rahul Kumar', customer: 'Aarav Sharma', rating: 5, comment: 'Very polite and quick delivery!', date: '2h ago', reply: false },
    { id: 'dr2', partner: 'Amit Singh', customer: 'Ananya Rao', rating: 4, comment: 'Good service, slight delay.', date: '5h ago', reply: true },
    { id: 'dr3', partner: 'Vijay Patel', customer: 'Vivaan Iyer', rating: 5, comment: 'Best delivery experience!', date: '1d ago', reply: false },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Deliveryman Reviews" subtitle="Customer feedback on delivery partners" actions={<ExportButton rows={reviews} filename="delivery-reviews.csv" />} />
      <div className="grid gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between">
              <div><p className="text-sm font-semibold">{r.partner}</p><p className="text-xs text-muted-foreground">by {r.customer} · {r.date}</p></div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">{[1,2,3,4,5].map((i) => <Star key={i} className={cn('h-3 w-3', i <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30')} />)}</div>
                {r.reply && <StatusBadge status="active" label="REPLIED" />}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
            <div className="mt-3 flex gap-2"><OutlineButton className="text-xs"><MessageSquare className="h-3.5 w-3.5" /> Reply</OutlineButton><OutlineButton className="text-xs"><Eye className="h-3.5 w-3.5" /> View order</OutlineButton></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DeliveryPartnersBonusView() {
  const bonuses = [
    { id: 'b1', partner: 'Rahul Kumar', type: 'Weekly Target', amount: 500, status: 'paid', date: 'Oct 12' },
    { id: 'b2', partner: 'Amit Singh', type: 'Peak Hours', amount: 300, status: 'pending', date: 'Oct 14' },
    { id: 'b3', partner: 'Vijay Patel', type: 'High Rating', amount: 250, status: 'paid', date: 'Oct 10' },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Wallet Bonus Setup" subtitle="Configure bonus payouts to delivery partners" actions={<PrimaryButton><Plus className="h-4 w-4" /> New Bonus</PrimaryButton>} />
      <div className="rounded-xl border border-border bg-background p-5 max-w-2xl mb-3">
        <h3 className="text-sm font-semibold mb-3">Bonus Type</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bonus Title" value="" onChange={() => {}} placeholder="e.g. Weekend Special" />
          <SelectField label="Bonus Type" value="percentage" onChange={() => {}} options={[{ value: 'percentage', label: 'Percentage (%)' }, { value: 'amount', label: 'Amount (₹)' }]} />
          <Field label="Bonus Amount" type="number" value="0" onChange={() => {}} />
          <Field label="Min Add Money (₹)" type="number" value="100" onChange={() => {}} />
          <Field label="Max Bonus (₹)" type="number" value="500" onChange={() => {}} />
          <Field label="Expire Date" type="date" value="" onChange={() => {}} />
        </div>
        <div className="flex gap-2 justify-end mt-3"><OutlineButton>Reset</OutlineButton><PrimaryButton>Submit</PrimaryButton></div>
      </div>
      <h3 className="text-sm font-semibold mt-4">Bonus List</h3>
      <DataTable
        columns={[
          { key: 'id', header: 'ID', render: (b) => <span className="font-mono text-xs">#{b.id}</span> },
          { key: 'partner', header: 'Partner', render: (b) => <span className="font-medium">{b.partner}</span> },
          { key: 'type', header: 'Bonus Info' },
          { key: 'amount', header: 'Bonus Amount', render: (b) => <span className="font-bold">{formatCurrency(b.amount)}</span> },
          { key: 'date', header: 'Started On' },
          { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
        ]}
        rows={bonuses}
        getActions={() => <><IconButton icon={Edit} label="Edit" tone="primary" /><IconButton icon={Trash2} label="Delete" tone="danger" /></>}
      />
    </div>
  )
}

export function DeliveryPartnersEarningAddonView() {
  return (
    <div className="space-y-4">
      <PageHeader title="Earning Addon" subtitle="Configure additional earning opportunities for delivery partners" actions={<PrimaryButton><Plus className="h-4 w-4" /> New Addon</PrimaryButton>} />
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { id: 'ea1', name: 'Peak Hours Bonus', value: '+₹10/delivery', condition: '6-9 PM weekdays', active: true },
          { id: 'ea2', name: 'Rain Surge', value: '+₹20/delivery', condition: 'When weather is rainy', active: true },
          { id: 'ea3', name: 'Long Distance', value: '+₹5/km beyond 5km', condition: 'Distance > 5km', active: false },
        ].map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{a.name}</h3><StatusBadge status={a.active ? 'active' : 'inactive'} /></div>
            <p className="mt-2 text-lg font-bold text-primary">{a.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{a.condition}</p>
            <div className="mt-3 flex gap-2"><OutlineButton className="flex-1 text-xs"><Edit className="h-3.5 w-3.5" /> Edit</OutlineButton><OutlineButton className="text-xs"><Power className="h-3.5 w-3.5" /></OutlineButton></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DeliveryPartnersEarningAddonHistoryView() {
  const history = [
    { id: 'h1', partner: 'Rahul Kumar', addon: 'Peak Hours Bonus', amount: 50, date: 'Oct 14, 6:30 PM' },
    { id: 'h2', partner: 'Amit Singh', addon: 'Rain Surge', amount: 40, date: 'Oct 13, 7:15 PM' },
    { id: 'h3', partner: 'Vijay Patel', addon: 'Long Distance', amount: 25, date: 'Oct 12, 8:00 PM' },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Earning Addon History" subtitle="History of earning addon payouts" actions={<ExportButton rows={history} filename="addon-history.csv" />} />
      <DataTable
        columns={[
          { key: 'id', header: 'ID', render: (h) => <span className="font-mono text-xs">#{h.id}</span> },
          { key: 'partner', header: 'Partner', render: (h) => <span className="font-medium">{h.partner}</span> },
          { key: 'addon', header: 'Addon' },
          { key: 'amount', header: 'Amount', render: (h) => <span className="font-bold">{formatCurrency(h.amount)}</span> },
          { key: 'date', header: 'Date', render: (h) => <span className="text-xs text-muted-foreground">{h.date}</span> },
        ]}
        rows={history}
        getActions={() => <IconButton icon={Eye} label="View" tone="primary" />}
      />
    </div>
  )
}

export function DeliveryPartnersEarningsView() {
  const deliveryMen = useAdminState((s) => s.deliveryMen)
  const [period, setPeriod] = useState('all')
  const earnings = deliveryMen.map((d, i) => ({ id: d.id, partner: d.full_name, phone: d.phone, deliveries: 20 + i * 5, earnings: 4500 + i * 800, bonus: 200 + i * 50, total: 4700 + i * 850 }))
  return (
    <div className="space-y-4">
      <PageHeader
        title="Delivery Earning"
        subtitle="Earnings summary for all delivery partners"
        actions={<>
          <SelectField label="Period" value={period} onChange={setPeriod} options={[
            { value: 'all', label: 'All Time' }, { value: 'today', label: 'Today' }, { value: 'week', label: 'This Week' }, { value: 'month', label: 'This Month' }
          ]} />
          <ExportButton rows={earnings} filename="delivery-earnings.csv" />
        </>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
        <StatCard label="Total Delivery Boys" value={formatNumber(deliveryMen.length)} icon={Users} accent="violet" />
        <StatCard label="Total Earnings" value={formatCurrency(earnings.reduce((s, e) => s + e.total, 0))} icon={Wallet} accent="emerald" />
        <StatCard label="Total Orders" value={formatNumber(earnings.reduce((s, e) => s + e.deliveries, 0))} icon={Truck} accent="blue" />
      </div>
      <DataTable
        columns={[
          { key: 'partner', header: 'Delivery Boy', render: (e: any) => <span className="font-medium">{e.partner}</span> },
          { key: 'phone', header: 'Phone' },
          { key: 'deliveries', header: 'Orders' },
          { key: 'earnings', header: 'Base Earning', render: (e: any) => formatCurrency(e.earnings) },
          { key: 'bonus', header: 'Bonus', render: (e: any) => <span className="text-emerald-600">{formatCurrency(e.bonus)}</span> },
          { key: 'total', header: 'Total', render: (e: any) => <span className="font-bold">{formatCurrency(e.total)}</span> },
        ]}
        rows={earnings}
        getActions={() => <OutlineButton className="text-xs"><Eye className="h-3.5 w-3.5" /> Details</OutlineButton>}
      />
    </div>
  )
}

export function ContactMessagesView() {
  const msgs = [
    { id: 'm1', name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 7470311228', subject: 'Feedback on app', message: 'Loving the new UI!', date: '2h ago', rating: 5, status: 'unread' },
    { id: 'm2', name: 'Priya Patel', email: 'priya@example.com', phone: '+91 98765 43210', subject: 'Bug report', message: 'Cart total shows wrong amount on iPhone.', date: '5h ago', rating: 2, status: 'read' },
    { id: 'm3', name: 'Amit Kumar', email: 'amit@example.com', phone: '+91 99887 76655', subject: 'Feature request', message: 'Please add scheduled deliveries.', date: '1d ago', rating: 4, status: 'unread' },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="User Feedback" subtitle="Messages from the contact-us form" actions={<ExportButton rows={msgs} filename="contact-messages.csv" />} />
      <DataTable
        columns={[
          { key: 'name', header: 'Customer Name', render: (m) => <span className="font-medium">{m.name}</span> },
          { key: 'email', header: 'Email Address' },
          { key: 'phone', header: 'Phone Number' },
          { key: 'subject', header: 'Subject' },
          { key: 'rating', header: 'Rating', render: (m) => <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" />{m.rating}</span> },
          { key: 'date', header: 'Submitted At', render: (m) => <span className="text-xs text-muted-foreground">{m.date}</span> },
          { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
        ]}
        rows={msgs}
        getActions={(m) => (
          <>
            <IconButton icon={Eye} label="View" tone="primary" />
            <PrimaryButton className="text-xs"><Mail className="h-3.5 w-3.5" /> Reply</PrimaryButton>
            {m.status === 'unread' && <OutlineButton className="text-xs">Mark Read</OutlineButton>}
          </>
        )}
      />
    </div>
  )
}

export function SafetyEmergencyReportsView() {
  const reports = [
    { id: 's1', type: 'SOS Alert', user: 'Rahul Kumar (Delivery)', location: 'MG Road', time: '2h ago', status: 'resolved' },
    { id: 's2', type: 'Harassment Report', user: 'Priya Patel (Customer)', location: 'Indiranagar', time: '5h ago', status: 'open' },
    { id: 's3', type: 'Accident', user: 'Amit Singh (Delivery)', location: 'Koramangala', time: '1d ago', status: 'open' },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Safety Emergency Reports" subtitle="Critical safety incidents reported on the platform" actions={<PrimaryButton className="bg-rose-600 hover:bg-rose-700"><Phone className="h-4 w-4" /> Emergency Hotline</PrimaryButton>} />
      <div className="grid gap-3">
        {reports.map((r) => (
          <div key={r.id} className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-rose-600" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{r.type} — {r.user}</p>
              <p className="text-xs text-muted-foreground">📍 {r.location} · {r.time}</p>
            </div>
            <StatusBadge status={r.status} />
            <div className="flex gap-2"><PrimaryButton className="text-xs bg-rose-600 hover:bg-rose-700">Investigate</PrimaryButton><OutlineButton className="text-xs">Resolve</OutlineButton></div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ====================================================================== */
/*  Reports                                                               */
/* ====================================================================== */

export function TransactionReportView() {
  const orders = useAdminState((s) => s.orders)
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0)
  const totalTax = orders.reduce((s, o) => s + ((o as any).tax_amount || 0), 0)
  const totalDelivery = orders.reduce((s, o) => s + (o.delivery_fee || 0), 0)
  const totalDiscount = orders.reduce((s, o) => s + ((o as any).discount_amount || 0), 0)
  return (
    <div className="space-y-4">
      <PageHeader title="Transaction Report" subtitle="All financial transactions on the platform" actions={<ExportButton rows={orders.map((o) => ({ code: o.order_code, customer: o.customer_name, total: o.total, tax: (o as any).tax_amount, delivery: o.delivery_fee, status: o.status }))} filename="transaction-report.csv" />} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={Wallet} accent="emerald" />
        <StatCard label="Tax Collected" value={formatCurrency(totalTax)} icon={Receipt} accent="amber" />
        <StatCard label="Delivery Fees" value={formatCurrency(totalDelivery)} icon={Truck} accent="blue" />
        <StatCard label="Discounts" value={formatCurrency(totalDiscount)} icon={Gift} accent="rose" />
      </div>
      <DataTable
        columns={[
          { key: 'order_code', header: 'Order ID', render: (o: any) => <span className="font-mono text-xs">{o.order_code}</span> },
          { key: 'customer_name', header: 'Customer', render: (o: any) => <span className="font-medium">{o.customer_name}</span> },
          { key: 'total', header: 'Amount', render: (o: any) => <span className="font-bold">{formatCurrency(o.total)}</span> },
          { key: 'payment_status', header: 'Payment', render: (o: any) => <StatusBadge status={(o as any).payment_status || 'paid'} /> },
          { key: 'createdAt', header: 'Date', render: (o: any) => <span className="text-xs text-muted-foreground">{timeAgo(o.createdAt)}</span> },
        ]}
        rows={orders.slice(0, 20)}
        getActions={() => <IconButton icon={Eye} label="View" tone="primary" />}
      />
    </div>
  )
}

export function OrderReportView() {
  const orders = useAdminState((s) => s.orders)
  const byStatus = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {} as Record<string, number>)
  return (
    <div className="space-y-4">
      <PageHeader title="Order Report" subtitle="Order volume and breakdown by status" actions={<ExportButton rows={Object.entries(byStatus).map(([k, v]) => ({ status: k, count: v }))} filename="order-report.csv" />} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Orders" value={formatNumber(orders.length)} icon={ShoppingBag} accent="emerald" />
        <StatCard label="Delivered" value={formatNumber(byStatus['delivered'] || 0)} icon={CheckCircle2} accent="blue" />
        <StatCard label="Pending" value={formatNumber(byStatus['pending'] || 0)} icon={AlertTriangle} accent="amber" />
        <StatCard label="Cancelled" value={formatNumber(byStatus['cancelled'] || 0)} icon={X} accent="rose" />
      </div>
      <DataTable
        columns={[
          { key: 'status', header: 'Status', render: (s: any) => <StatusBadge status={s.status} /> },
          { key: 'count', header: 'Count', render: (s: any) => <span className="font-bold">{s.count}</span> },
        ]}
        rows={Object.entries(byStatus).map(([k, v]) => ({ id: k, status: k, count: v }))}
      />
    </div>
  )
}

export function TaxReportView() {
  const orders = useAdminState((s) => s.orders)
  const tax = orders.reduce((s, o) => s + ((o as any).tax_amount || 0), 0)
  const taxable = orders.reduce((s, o) => s + (o.subtotal || 0), 0)
  return (
    <div className="space-y-4">
      <PageHeader title="Tax Report" subtitle="GST and tax collected on orders" actions={<ExportButton rows={orders.map((o) => ({ code: o.order_code, subtotal: o.subtotal, tax: (o as any).tax_amount, total: o.total }))} filename="tax-report.csv" />} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Taxable Amount" value={formatCurrency(taxable)} icon={Receipt} accent="blue" />
        <StatCard label="Tax Collected (5%)" value={formatCurrency(tax)} icon={Wallet} accent="emerald" />
        <StatCard label="Total Orders" value={formatNumber(orders.length)} icon={ShoppingBag} accent="violet" />
      </div>
    </div>
  )
}

export function RestaurantReportView() {
  const stores = useAdminState((s) => s.stores)
  const orders = useAdminState((s) => s.orders)
  const rows = stores.map((s) => {
    const storeOrders = orders.filter((o) => o.store_id === s.id)
    const revenue = storeOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    return { id: s.id, name: s.name, orders: storeOrders.length, revenue, rating: s.rating || 0 }
  }).sort((a, b) => b.revenue - a.revenue)
  return (
    <div className="space-y-4">
      <PageHeader title="Restaurant Report" subtitle="Performance report by restaurant" actions={<ExportButton rows={rows} filename="restaurant-report.csv" />} />
      <DataTable
        columns={[
          { key: 'name', header: 'Restaurant', render: (r: any) => <span className="font-medium">{r.name}</span> },
          { key: 'orders', header: 'Orders' },
          { key: 'revenue', header: 'Revenue', render: (r: any) => <span className="font-bold">{formatCurrency(r.revenue)}</span> },
          { key: 'rating', header: 'Rating', render: (r: any) => <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" />{r.rating.toFixed(1)}</span> },
        ]}
        rows={rows}
        getActions={() => <IconButton icon={Eye} label="View" tone="primary" />}
      />
    </div>
  )
}

export function CustomerReportView() {
  const customers = useAdminState((s) => s.customers)
  return (
    <div className="space-y-4">
      <PageHeader title="Feedback Experience" subtitle="Customer satisfaction and feedback metrics" actions={<ExportButton rows={customers.map((c) => ({ name: c.full_name, orders: c.total_orders, spent: c.total_spent, rating: 4.5 }))} filename="customer-report.csv" />} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Customers" value={formatNumber(customers.length)} icon={Users} accent="emerald" />
        <StatCard label="Active" value={formatNumber(customers.filter((c) => c.is_active).length)} icon={CheckCircle2} accent="blue" />
        <StatCard label="Avg Spent" value={formatCurrency(customers.reduce((s, c) => s + c.total_spent, 0) / Math.max(1, customers.length))} icon={Wallet} accent="violet" />
        <StatCard label="Avg Rating" value="4.6" icon={Star} accent="amber" />
      </div>
    </div>
  )
}

/* ====================================================================== */
/*  Withdraws / Banners / Notifications / Setup                          */
/* ====================================================================== */

export function RestaurantWithdrawsView() {
  const withdraws = [
    { id: 'rw1', restaurant: 'Spice Garden', amount: 12450, status: 'pending', date: '2h ago', bank: 'HDFC ****1234', holder: 'Spice Garden Pvt Ltd' },
    { id: 'rw2', restaurant: 'Pizza Corner', amount: 8900, status: 'paid', date: '5h ago', bank: 'ICICI ****5678', holder: 'Pizza Corner LLP' },
    { id: 'rw3', restaurant: 'Burger Barn', amount: 6700, status: 'pending', date: '1d ago', bank: 'SBI ****9012', holder: 'Burger Barn Inc' },
    { id: 'rw4', restaurant: 'Tandoori Nights', amount: 15300, status: 'rejected', date: '2d ago', bank: 'Axis ****3456', holder: 'Tandoori Nights' },
  ]
  return (
    <div className="space-y-4">
      <PageHeader title="Restaurant Withdraws" subtitle="Payout withdrawal requests from restaurants" actions={<ExportButton rows={withdraws} filename="restaurant-withdraws.csv" />} />
      <DataTable
        columns={[
          { key: 'id', header: 'ID', render: (w) => <span className="font-mono text-xs">#{w.id}</span> },
          { key: 'restaurant', header: 'Restaurant', render: (w) => <span className="font-medium">{w.restaurant}</span> },
          { key: 'amount', header: 'Amount', render: (w) => <span className="font-bold">{formatCurrency(w.amount)}</span> },
          { key: 'bank', header: 'Bank Account', render: (w) => <div className="text-xs"><div>{w.bank}</div><div className="text-muted-foreground">{w.holder}</div></div> },
          { key: 'status', header: 'Status', render: (w) => <StatusBadge status={w.status} /> },
          { key: 'date', header: 'Date', render: (w) => <span className="text-xs text-muted-foreground">{w.date}</span> },
        ]}
        rows={withdraws}
        getActions={(w) => w.status === 'pending' ? (
          <>
            <PrimaryButton className="text-xs">Approve</PrimaryButton>
            <OutlineButton className="text-xs text-rose-600">Reject</OutlineButton>
          </>
        ) : <IconButton icon={Eye} label="View" tone="primary" />}
      />
    </div>
  )
}

export function HeroBannerManagementView() {
  const banners = useAdminState((s) => s.banners).slice(0, 3)
  return (
    <div className="space-y-4">
      <PageHeader title="Landing Page Management" subtitle="Hero banners shown on the customer landing page" actions={<PrimaryButton><Plus className="h-4 w-4" /> Add New Banner</PrimaryButton>} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b) => (
          <div key={b.id} className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="aspect-video bg-muted">{b.image_url && <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />}</div>
            <div className="p-3">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold truncate">{b.title}</p><StatusBadge status={b.is_active ? 'active' : 'inactive'} /></div>
              <div className="mt-2 flex gap-2"><IconButton icon={Edit} label="Edit" tone="primary" /><IconButton icon={Power} label="Toggle" /><ConfirmButton trigger={<IconButton icon={Trash2} label="Delete" tone="danger" />} title="Delete banner?" onConfirm={() => toast.info('Banner deleted')} /></div>
            </div>
          </div>
        ))}
        {!banners.length && <EmptyState icon={ImageIcon} title="No banners" description="Upload your first hero banner." />}
      </div>
    </div>
  )
}

export function PromotionalBannerView() {
  const banners = useAdminState((s) => s.banners)
  return (
    <div className="space-y-4">
      <PageHeader title="Promotional Banners" subtitle="Banners shown in-app to customers" actions={<PrimaryButton><Plus className="h-4 w-4" /> Add New Banner</PrimaryButton>} />
      <DataTable
        columns={[
          { key: 'image', header: 'Image', render: (b: any) => <div className="h-10 w-16 rounded bg-muted overflow-hidden">{b.image_url && <img src={b.image_url} alt="" className="h-full w-full object-cover" />}</div> },
          { key: 'title', header: 'Banner Info', render: (b: any) => <span className="font-medium">{b.title}</span> },
          { key: 'redirect_type', header: 'Banner Type', render: (b: any) => <span className="text-xs capitalize">{b.redirect_type || 'none'}</span> },
          { key: 'position', header: 'Position' },
          { key: 'is_active', header: 'Status', render: (b: any) => <StatusBadge status={b.is_active ? 'active' : 'inactive'} /> },
        ]}
        rows={banners}
        getActions={() => <><IconButton icon={Edit} label="Edit" tone="primary" /><IconButton icon={Power} label="Toggle" /><ConfirmButton trigger={<IconButton icon={Trash2} label="Delete" tone="danger" />} title="Delete banner?" onConfirm={() => toast.info('Banner deleted')} /></>}
      />
    </div>
  )
}

export function BroadcastNotificationView() {
  const [msg, setMsg] = useState({ title: '', body: '', audience: 'all' })
  const send = () => {
    if (!msg.title || !msg.body) { toast.error('Title and body required'); return }
    notificationActions.add({ title: msg.title, body: msg.body, type: 'broadcast' })
    toast.success('Broadcast sent to all users')
    setMsg({ title: '', body: '', audience: 'all' })
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Broadcast Notification" subtitle="Send push notifications to all customers or a segment" />
      <div className="rounded-xl border border-border bg-background p-5 max-w-2xl space-y-3">
        <Field label="Title" value={msg.title} onChange={(v) => setMsg({ ...msg, title: v })} placeholder="Weekend Special!" />
        <TextareaField label="Message" value={msg.body} onChange={(v) => setMsg({ ...msg, body: v })} placeholder="Get 25% off on all orders this weekend…" />
        <SelectField label="Audience" value={msg.audience} onChange={(v) => setMsg({ ...msg, audience: v })} options={[
          { value: 'all', label: 'All customers' },
          { value: 'active', label: 'Active customers (7d)' },
          { value: 'inactive', label: 'Inactive users (30d)' },
        ]} />
        <div className="flex gap-2 justify-end"><OutlineButton>Save Draft</OutlineButton><PrimaryButton onClick={send}><Bell className="h-4 w-4" /> Send Now</PrimaryButton></div>
      </div>
    </div>
  )
}

export function BusinessSetupView() {
  const [biz, setBiz] = useState({
    companyName: 'Food Munch', supportEmail: 'support@foodmunch.com', supportPhone: '+91 80 4567 8900',
    address: 'MG Road, Bengaluru, KA 560001', pincode: '560001', state: 'Karnataka', country: 'India',
    currency: 'INR', timezone: 'Asia/Kolkata', logoUrl: '/food-munch-logo.jpg',
  })
  const set = (k: string, v: string) => setBiz((b) => ({ ...b, [k]: v }))
  return (
    <div className="space-y-4">
      <PageHeader title="Business setup" subtitle="Core business information shown across the platform" />
      <div className="rounded-xl border border-border bg-background p-5 max-w-2xl space-y-4">
        <div className="pb-3 border-b border-border">
          <h3 className="text-sm font-semibold mb-3">Company Information</h3>
          <div className="grid sm:grid-cols-4 gap-3">
            {[
              { k: 'logo', label: 'Logo' },
              { k: 'favicon', label: 'Favicon' },
              { k: 'restaurant-logo', label: 'Restaurant Logo' },
              { k: 'delivery-logo', label: 'Delivery Logo' },
            ].map((u) => (
              <div key={u.k} className="border-2 border-dashed border-border rounded-lg p-3 text-center text-[10px] text-muted-foreground hover:border-primary/40 cursor-pointer">
                <Upload className="h-4 w-4 mx-auto mb-1" />
                {u.label}
              </div>
            ))}
          </div>
        </div>
        <Field label="Company Name" value={biz.companyName} onChange={(v) => set('companyName', v)} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Support Email" value={biz.supportEmail} onChange={(v) => set('supportEmail', v)} />
          <Field label="Support Phone" value={biz.supportPhone} onChange={(v) => set('supportPhone', v)} />
        </div>
        <TextareaField label="Address" value={biz.address} onChange={(v) => set('address', v)} rows={2} />
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Pincode" value={biz.pincode} onChange={(v) => set('pincode', v)} />
          <Field label="State" value={biz.state} onChange={(v) => set('state', v)} />
          <SelectField label="Country" value={biz.country} onChange={(v) => set('country', v)} options={[{ value: 'India', label: 'India' }, { value: 'USA', label: 'USA' }]} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <SelectField label="Currency" value={biz.currency} onChange={(v) => set('currency', v)} options={[{ value: 'INR', label: '₹ INR' }, { value: 'USD', label: '$ USD' }]} />
          <SelectField label="Timezone" value={biz.timezone} onChange={(v) => set('timezone', v)} options={[{ value: 'Asia/Kolkata', label: 'Asia/Kolkata' }, { value: 'UTC', label: 'UTC' }]} />
        </div>
        <div className="flex justify-end pt-2"><OutlineButton>Reset</OutlineButton><PrimaryButton className="ml-2" onClick={() => toast.success('Business profile saved')}><CheckCircle2 className="h-4 w-4" /> Save Information</PrimaryButton></div>
      </div>
    </div>
  )
}

export function FeatureSettingsView() {
  const [features, setFeatures] = useState([
    { key: 'restaurant_subscription', label: 'Restaurant Subscriptions', desc: 'Enable subscription billing for restaurants', enabled: true },
    { key: 'cod_control', label: 'Cash on Delivery', desc: 'Allow COD payments', enabled: true },
    { key: 'admin_access_section', label: 'Sub Admin Access', desc: 'Enable role-based admin access', enabled: false },
    { key: 'root_landing_and_unregistered_control', label: 'Unregistered Restaurants', desc: 'Show unregistered restaurant section', enabled: true },
    { key: 'dining_management', label: 'Dining Management', desc: 'Enable dine-in features', enabled: false },
  ])
  const toggle = (k: string) => setFeatures((f) => f.map((x) => x.key === k ? { ...x, enabled: !x.enabled } : x))
  return (
    <div className="space-y-4">
      <PageHeader title="Feature Settings" subtitle="Toggle platform features on or off" />
      <div className="rounded-xl border border-border bg-background divide-y divide-border max-w-2xl">
        {features.map((f) => (
          <div key={f.key} className="p-4">
            <Toggle label={f.label} desc={f.desc} checked={f.enabled} onChange={() => toggle(f.key)} />
          </div>
        ))}
      </div>
      <div className="flex justify-end"><PrimaryButton onClick={() => toast.success('Feature settings saved')}><CheckCircle2 className="h-4 w-4" /> Save</PrimaryButton></div>
    </div>
  )
}

export function PowerScanningView() {
  return <PlaceholderView title="Power Scanning" description="High-throughput QR/barcode scanner for bulk operations." icon={Zap} actions={<PrimaryButton><Zap className="h-4 w-4" /> Activate Scanner</PrimaryButton>} />
}

export function EmployeesView() {
  const [employees, setEmployees] = useState([
    { id: 'e1', name: 'Aarav Admin', email: 'aarav@foodmunch.com', role: 'Admin', status: 'active', lastLogin: '2h ago', zone: 'All' },
    { id: 'e2', name: 'Priya Manager', email: 'priya@foodmunch.com', role: 'Manager', status: 'active', lastLogin: '5h ago', zone: 'Zone 1' },
    { id: 'e3', name: 'Amit Support', email: 'amit@foodmunch.com', role: 'Customer Care Executive', status: 'inactive', lastLogin: '3d ago', zone: 'Zone 2' },
  ])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'Admin', zone: 'All' })
  return (
    <div className="space-y-4">
      <PageHeader title="Sub Admin List" subtitle="Manage admin employees with platform access" actions={<PrimaryButton onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Add New Employee</PrimaryButton>} />
      <DataTable
        columns={[
          { key: 'name', header: 'Name', render: (e: any) => <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">{e.name[0]}</div><span className="font-medium">{e.name}</span></div> },
          { key: 'email', header: 'Email' },
          { key: 'role', header: 'Role', render: (e: any) => <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">{e.role}</span> },
          { key: 'zone', header: 'Zone' },
          { key: 'status', header: 'Status', render: (e: any) => <StatusBadge status={e.status} /> },
          { key: 'lastLogin', header: 'Last Login', render: (e: any) => <span className="text-xs text-muted-foreground">{e.lastLogin}</span> },
        ]}
        rows={employees}
        getActions={(e: any) => <><IconButton icon={Eye} label="View" tone="primary" /><IconButton icon={Edit} label="Edit" tone="primary" /><IconButton icon={Power} label="Toggle" /><ConfirmButton trigger={<IconButton icon={Trash2} label="Delete" tone="danger" />} title="Delete employee?" description={`This will remove ${e.name}.`} onConfirm={() => setEmployees((emps) => emps.filter((x) => x.id !== e.id))} /></>}
      />
      <Modal open={modal} onClose={() => setModal(false)} title="Add New Employee" size="lg">
        <div className="space-y-3">
          <div className="border-2 border-dashed border-border rounded-lg p-3 text-center text-xs text-muted-foreground">
            <Upload className="h-5 w-5 mx-auto mb-1" /> Employee image
            <p className="text-[10px] mt-0.5">Image format - jpg png jpeg gif · max 2 MB · Ratio 1:1</p>
          </div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">General Information</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
            <Field label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          </div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mt-2">Account Info</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
            <Field label="Confirm Password" type="password" value={form.confirmPassword} onChange={(v) => setForm({ ...form, confirmPassword: v })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <SelectField label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={[{ value: 'Admin', label: 'Admin' }, { value: 'Manager', label: 'Manager' }, { value: 'Customer Care Executive', label: 'Customer Care Executive' }]} />
            <SelectField label="Zone" value={form.zone} onChange={(v) => setForm({ ...form, zone: v })} options={[{ value: 'All', label: 'All' }, { value: 'Zone 1', label: 'Zone 1' }, { value: 'Zone 2', label: 'Zone 2' }, { value: 'Zone 3', label: 'Zone 3' }]} />
          </div>
          <div className="flex gap-2 justify-end pt-2"><OutlineButton onClick={() => setModal(false)}>Reset</OutlineButton><PrimaryButton onClick={() => { setEmployees((e) => [{ id: `e_${Date.now()}`, name: `${form.firstName} ${form.lastName}`.trim() || 'New Employee', email: form.email || 'new@foodmunch.com', role: form.role, status: 'active', lastLogin: 'just now', zone: form.zone }, ...e]); setModal(false); toast.success('Employee created') }}>Submit</PrimaryButton></div>
        </div>
      </Modal>
    </div>
  )
}

export function EmployeeRoleView() {
  const [roles, setRoles] = useState([
    { id: 'r1', name: 'Super Admin', permissions: 'all', users: 1 },
    { id: 'r2', name: 'Operations', permissions: 'orders, restaurants, delivery', users: 4 },
    { id: 'r3', name: 'Support', permissions: 'tickets, customers', users: 8 },
    { id: 'r4', name: 'Finance', permissions: 'wallets, payouts, reports', users: 2 },
  ])
  return (
    <div className="space-y-4">
      <PageHeader title="Employee Roles" subtitle="Define roles and their permissions" actions={<PrimaryButton><Plus className="h-4 w-4" /> New Role</PrimaryButton>} />
      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{r.name}</h3><span className="text-xs text-muted-foreground">{r.users} users</span></div>
            <p className="mt-2 text-xs text-muted-foreground">{r.permissions}</p>
            <div className="mt-3 flex gap-2"><OutlineButton className="flex-1 text-xs"><Edit className="h-3.5 w-3.5" /> Edit Permissions</OutlineButton><ConfirmButton trigger={<IconButton icon={Trash2} label="Delete" tone="danger" />} title="Delete role?" description={`This will remove the ${r.name} role.`} onConfirm={() => setRoles((rs) => rs.filter((x) => x.id !== r.id))} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ====================================================================== */
/*  Pages & Social Media                                                  */
/* ====================================================================== */

const PAGES = [
  { key: 'about', title: 'About Us', icon: Globe, content: 'Food Munch is India\'s leading food delivery platform connecting customers with their favourite restaurants. Founded in 2020, we serve over 50,000 customers daily across 12 cities.' },
  { key: 'terms', title: 'Terms & Conditions', icon: FileText, content: 'By using Food Munch, you agree to our terms of service. All orders are subject to restaurant availability and delivery partner confirmation.' },
  { key: 'privacy', title: 'Privacy Policy', icon: Lock, content: 'We respect your privacy. Your data is encrypted and never shared with third parties without your explicit consent.' },
  { key: 'support', title: 'Support', icon: Headset, content: 'Need help? Reach our 24/7 support team at support@foodmunch.com or call +91 80 4567 8900.' },
  { key: 'refund', title: 'Refund Policy', icon: Receipt, content: 'Refunds are processed within 5-7 business days. Cancellation before preparation qualifies for full refund.' },
  { key: 'shipping', title: 'Shipping Policy', icon: Truck, content: 'Delivery is available within 10km of partner restaurants. Standard delivery time is 30-45 minutes.' },
  { key: 'cancellation', title: 'Cancellation Policy', icon: X, content: 'Orders can be cancelled free of charge before preparation starts. Post-preparation cancellations may incur a fee.' },
]

export function PagesSocialMediaView() {
  const [activeKey, setActiveKey] = useState('about')
  const [contents, setContents] = useState<Record<string, string>>(() => Object.fromEntries(PAGES.map((p) => [p.key, p.content])))
  const [edited, setEdited] = useState(false)
  const active = PAGES.find((p) => p.key === activeKey) || PAGES[0]
  const save = () => { toast.success(`${active.title} saved`); setEdited(false) }
  return (
    <div className="space-y-4">
      <PageHeader title="Pages & Social Media" subtitle="Manage static pages and social media links" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-1">
          {PAGES.map((p) => {
            const Icon = p.icon
            return (
              <button key={p.key} onClick={() => { setActiveKey(p.key); setEdited(false) }} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors', activeKey === p.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground hover:bg-muted')}>
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{p.title}</span>
              </button>
            )
          })}
        </div>
        <div className="lg:col-span-2 rounded-xl border border-border bg-background p-5 space-y-3">
          <h3 className="text-base font-semibold flex items-center gap-2"><active.icon className="h-4 w-4" /> {active.title}</h3>
          <TextareaField label="Page content" value={contents[activeKey] || ''} onChange={(v) => { setContents((c) => ({ ...c, [activeKey]: v })); setEdited(true) }} rows={10} />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{edited ? 'Unsaved changes' : 'All changes saved'}</p>
            <div className="flex gap-2"><OutlineButton>Preview</OutlineButton><PrimaryButton onClick={save} disabled={!edited}><CheckCircle2 className="h-4 w-4" /> Save</PrimaryButton></div>
          </div>
        </div>
      </div>
    </div>
  )
}
