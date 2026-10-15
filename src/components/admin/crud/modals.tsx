'use client'

/**
 * CRUD modals for all admin entities — fully functional.
 */
import { useState, useEffect } from 'react'
import {
  Modal, Field, SelectField, TextareaField, PrimaryButton, Toggle,
  ImageUpload, SwButton, SwSectionLabel,
  formatCurrency,
} from '../shared'
import { useAdminState, customerActions, vendorActions, deliveryManActions, storeActions, deliveryAreaActions, walletActions } from '@/lib/admin-data'
import { Customer, Vendor, DeliveryMan, Store, DeliveryArea, WalletTxType } from '@/lib/types'
import { Plus, Trash2, Wallet } from 'lucide-react'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Customer Modal                                                     */
/* ------------------------------------------------------------------ */

export function CustomerModal({
  open, onClose, editing,
}: {
  open: boolean
  onClose: () => void
  editing?: Customer | null
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState('')

  useEffect(() => {
    if (editing) {
      setName(editing.full_name); setEmail(editing.email); setPhone(editing.phone)
      setAvatar(editing.avatar_url || ''); setPassword('')
    } else {
      setName(''); setEmail(''); setPhone(''); setPassword(''); setAvatar('')
    }
  }, [editing, open])

  const submit = () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Name, email, and phone are required')
      return
    }
    if (!avatar) {
      toast.error('Profile image is mandatory — please upload an avatar')
      return
    }
    if (editing) {
      customerActions.update(editing.id, { full_name: name, email, phone, avatar_url: avatar })
      toast.success('Customer updated')
    } else {
      customerActions.create({ full_name: name, email, phone, avatar_url: avatar })
      toast.success('Customer created')
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Customer' : 'Add Customer'} description="Customer can sign in with these credentials." size="lg">
      <div className="space-y-4">
        <ImageUpload
          label="Profile Image"
          value={avatar}
          onChange={setAvatar}
          required
          description="PNG, JPG up to 2MB · 1:1 ratio recommended"
          maxSizeMB={2}
          aspect="square"
        />
        <Field label="Full Name *" value={name} onChange={setName} placeholder="Rahul Sharma" />
        <Field label="Email Address *" value={email} onChange={setEmail} placeholder="rahul@example.com" type="email" />
        <Field label="Phone Number *" value={phone} onChange={setPhone} placeholder="+91 98000 00000" />
        {!editing && (
          <Field label="Temporary Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
        )}
        <div className="flex justify-end gap-2 pt-2">
          <SwButton variant="outline" onClick={onClose}>Cancel</SwButton>
          <SwButton onClick={submit}>{editing ? 'Save Changes' : 'Create Customer'}</SwButton>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Vendor Modal                                                       */
/* ------------------------------------------------------------------ */

export function VendorModal({
  open, onClose, editing,
}: {
  open: boolean
  onClose: () => void
  editing?: Vendor | null
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [avatar, setAvatar] = useState('')

  useEffect(() => {
    if (editing) {
      setName(editing.full_name); setEmail(editing.email); setPhone(editing.phone)
      setPassword(''); setStoreName(''); setAvatar(editing.avatar_url || '')
    } else {
      setName(''); setEmail(''); setPhone(''); setPassword(''); setStoreName(''); setAvatar('')
    }
  }, [editing, open])

  const submit = () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Name, email, and phone are required')
      return
    }
    if (!avatar) {
      toast.error('Profile image is mandatory — please upload an avatar')
      return
    }
    if (editing) {
      vendorActions.update(editing.id, { full_name: name, email, phone, avatar_url: avatar })
      toast.success('Vendor updated')
    } else {
      vendorActions.create({
        full_name: name, email, phone, avatar_url: avatar,
        store_id: storeName.trim() ? `new_${storeName.trim()}` : undefined,
      })
      toast.success('Vendor created')
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Vendor' : 'Add Vendor'} size="lg">
      <div className="space-y-4">
        <ImageUpload
          label="Profile Image"
          value={avatar}
          onChange={setAvatar}
          required
          description="PNG, JPG up to 2MB · 1:1 ratio"
          maxSizeMB={2}
          aspect="square"
        />
        <Field label="Vendor Full Name *" value={name} onChange={setName} placeholder="Vikram Sharma" />
        <Field label="Email *" value={email} onChange={setEmail} type="email" placeholder="vikram@store.com" />
        <Field label="Phone *" value={phone} onChange={setPhone} placeholder="+91 98000 00000" />
        {!editing && (
          <>
            <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
            <Field label="Store Name (creates a new store)" value={storeName} onChange={setStoreName} placeholder="Spice Garden Restaurant" />
          </>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <SwButton variant="outline" onClick={onClose}>Cancel</SwButton>
          <SwButton onClick={submit}>{editing ? 'Save Changes' : 'Create Vendor'}</SwButton>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Delivery Man Modal                                                 */
/* ------------------------------------------------------------------ */

export function DeliveryManModal({
  open, onClose, editing,
}: {
  open: boolean
  onClose: () => void
  editing?: DeliveryMan | null
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [vehicle, setVehicle] = useState<DeliveryMan['vehicle_type']>('bike')
  const [avatar, setAvatar] = useState('')

  useEffect(() => {
    if (editing) {
      setName(editing.full_name); setEmail(editing.email); setPhone(editing.phone)
      setVehicle(editing.vehicle_type); setPassword(''); setAvatar(editing.avatar_url || '')
    } else {
      setName(''); setEmail(''); setPhone(''); setPassword(''); setVehicle('bike'); setAvatar('')
    }
  }, [editing, open])

  const submit = () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Name, email, and phone are required')
      return
    }
    if (!avatar) {
      toast.error('Profile image is mandatory — please upload an avatar')
      return
    }
    if (editing) {
      deliveryManActions.update(editing.id, { full_name: name, email, phone, vehicle_type: vehicle, avatar_url: avatar })
      toast.success('Delivery partner updated')
    } else {
      deliveryManActions.create({ full_name: name, email, phone, vehicle_type: vehicle, avatar_url: avatar })
      toast.success('Delivery partner created')
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Delivery Man' : 'Add Delivery Man'} size="lg">
      <div className="space-y-4">
        <ImageUpload
          label="Profile Image"
          value={avatar}
          onChange={setAvatar}
          required
          description="PNG, JPG up to 2MB · 1:1 ratio"
          maxSizeMB={2}
          aspect="square"
        />
        <Field label="Full Name *" value={name} onChange={setName} placeholder="Ramesh Kumar" />
        <Field label="Email *" value={email} onChange={setEmail} type="email" placeholder="ramesh@delivery.com" />
        <Field label="Phone *" value={phone} onChange={setPhone} placeholder="+91 98000 00000" />
        {!editing && <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />}
        <SelectField
          label="Vehicle Type"
          value={vehicle}
          onChange={(v) => setVehicle(v as DeliveryMan['vehicle_type'])}
          options={[
            { value: 'bike', label: 'Bike' },
            { value: 'scooter', label: 'Scooter' },
            { value: 'cycle', label: 'Cycle' },
            { value: 'car', label: 'Car' },
          ]}
        />
        <div className="flex justify-end gap-2 pt-2">
          <SwButton variant="outline" onClick={onClose}>Cancel</SwButton>
          <SwButton onClick={submit}>{editing ? 'Save Changes' : 'Create Delivery Man'}</SwButton>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Store Modal                                                         */
/* ------------------------------------------------------------------ */

export function StoreModal({
  open, onClose, editing,
}: {
  open: boolean
  onClose: () => void
  editing?: Store | null
}) {
  const vendors = useAdminState((s) => s.vendors)
  const [name, setName] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [minOrder, setMinOrder] = useState('200')
  const [deliveryFee, setDeliveryFee] = useState('30')
  const [deliveryTime, setDeliveryTime] = useState('35')
  const [commission, setCommission] = useState('10')
  const [latitude, setLatitude] = useState('12.9716')
  const [longitude, setLongitude] = useState('77.5946')
  const [isActive, setIsActive] = useState(true)
  const [isOpen, setIsOpen] = useState(true)
  // Mandatory logo + cover image
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')

  useEffect(() => {
    if (editing) {
      setName(editing.name); setVendorId(editing.vendor_id); setAddress(editing.address)
      setPhone(editing.phone); setEmail(editing.email || ''); setDescription(editing.description || '')
      setMinOrder(String(editing.minimum_order)); setDeliveryFee(String(editing.delivery_fee))
      setDeliveryTime(String(editing.delivery_time_minutes)); setCommission(String(editing.commission_percentage))
      setLatitude(editing.latitude ? String(editing.latitude) : ''); setLongitude(editing.longitude ? String(editing.longitude) : '')
      setIsActive(editing.is_active); setIsOpen(editing.is_open)
      setLogoUrl(editing.logo_url || ''); setCoverUrl(editing.cover_url || '')
    } else {
      setName(''); setVendorId(vendors[0]?.id || ''); setAddress(''); setPhone(''); setEmail('')
      setDescription(''); setMinOrder('200'); setDeliveryFee('30'); setDeliveryTime('35'); setCommission('10')
      setLatitude('12.9716'); setLongitude('77.5946'); setIsActive(true); setIsOpen(true)
      setLogoUrl(''); setCoverUrl('')
    }
  }, [editing, open, vendors])

  const submit = () => {
    if (!name.trim() || !vendorId) {
      toast.error('Store name and vendor are required')
      return
    }
    if (!logoUrl) {
      toast.error('Restaurant logo is mandatory — please upload a logo image')
      return
    }
    if (!coverUrl) {
      toast.error('Restaurant cover image is mandatory — please upload a cover')
      return
    }
    const payload = {
      name, vendor_id: vendorId, address, phone, email, description,
      minimum_order: Number(minOrder) || 0,
      delivery_fee: Number(deliveryFee) || 0,
      delivery_time_minutes: Number(deliveryTime) || 0,
      commission_percentage: Number(commission) || 0,
      latitude: Number(latitude) || undefined,
      longitude: Number(longitude) || undefined,
      is_active: isActive, is_open: isOpen,
      logo_url: logoUrl,
      cover_url: coverUrl,
    }
    if (editing) {
      storeActions.update(editing.id, payload)
      toast.success('Restaurant updated')
    } else {
      storeActions.create(payload)
      toast.success('Restaurant created')
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Restaurant' : 'Add Restaurant'} size="xl">
      <div className="space-y-4">
        <SwSectionLabel>Restaurant Images</SwSectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUpload
            label="Restaurant Logo"
            value={logoUrl}
            onChange={setLogoUrl}
            required
            description="PNG, JPG up to 5MB · 1:1 ratio"
            maxSizeMB={5}
            aspect="square"
          />
          <ImageUpload
            label="Cover Image"
            value={coverUrl}
            onChange={setCoverUrl}
            required
            description="PNG, JPG up to 5MB · 2:1 ratio"
            maxSizeMB={5}
            aspect="wide"
          />
        </div>

        <SwSectionLabel className="mt-4">Restaurant Information</SwSectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Restaurant Name *" value={name} onChange={setName} placeholder="Spice Garden Restaurant" />
          <SelectField
            label="Vendor *"
            value={vendorId}
            onChange={setVendorId}
            options={vendors.map((v) => ({ value: v.id, label: v.full_name }))}
          />
        </div>
        <TextareaField label="Description" value={description} onChange={setDescription} placeholder="Authentic Indian cuisine…" />

        <SwSectionLabel className="mt-4">Contact & Location</SwSectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone *" value={phone} onChange={setPhone} placeholder="+91 80 1234 5678" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="orders@store.com" />
        </div>
        <Field label="Address *" value={address} onChange={setAddress} placeholder="12 MG Road, Bangalore" />

        <SwSectionLabel className="mt-4">Pricing & Logistics</SwSectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Min Order ₹" value={minOrder} onChange={setMinOrder} type="number" />
          <Field label="Delivery Fee ₹" value={deliveryFee} onChange={setDeliveryFee} type="number" />
          <Field label="Delivery Time (min)" value={deliveryTime} onChange={setDeliveryTime} type="number" />
          <Field label="Commission %" value={commission} onChange={setCommission} type="number" />
          <Field label="Latitude" value={latitude} onChange={setLatitude} />
          <Field label="Longitude" value={longitude} onChange={setLongitude} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Active" checked={isActive} onChange={setIsActive} />
          <Toggle label="Open Now" checked={isOpen} onChange={setIsOpen} />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <SwButton variant="outline" onClick={onClose}>Cancel</SwButton>
          <SwButton onClick={submit}>{editing ? 'Save Changes' : 'Create Restaurant'}</SwButton>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Delivery Area Modal (per-store pincodes)                          */
/* ------------------------------------------------------------------ */

export function DeliveryAreaModal({
  open, onClose, storeId, editing,
}: {
  open: boolean
  onClose: () => void
  storeId: string
  editing?: DeliveryArea | null
}) {
  const [pincode, setPincode] = useState('')
  const [fee, setFee] = useState('30')
  const [time, setTime] = useState('35')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (editing) {
      setPincode(editing.pincode); setFee(String(editing.delivery_fee))
      setTime(String(editing.delivery_time_minutes)); setActive(editing.is_active)
    } else {
      setPincode(''); setFee('30'); setTime('35'); setActive(true)
    }
  }, [editing, open])

  const submit = () => {
    if (!pincode.trim()) return
    const payload = {
      pincode,
      delivery_fee: Number(fee) || 0,
      delivery_time_minutes: Number(time) || 0,
      is_active: active,
    }
    if (editing) {
      deliveryAreaActions.update(editing.id, payload)
    } else {
      deliveryAreaActions.create({ ...payload, store_id: storeId })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Delivery Area' : 'Add Delivery Area'}>
      <div className="space-y-4">
        <Field label="Pincode" value={pincode} onChange={setPincode} placeholder="560001" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Delivery Fee ₹" value={fee} onChange={setFee} type="number" />
          <Field label="Delivery Time (min)" value={time} onChange={setTime} type="number" />
        </div>
        <Toggle label="Active" checked={active} onChange={setActive} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Cancel</button>
          <PrimaryButton onClick={submit}>{editing ? 'Save Changes' : 'Add Area'}</PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Wallet Adjust Modal                                                */
/* ------------------------------------------------------------------ */

export function WalletAdjustModal({
  open, onClose, userId, userRole, userName, currentBalance, initialType = 'credit',
}: {
  open: boolean
  onClose: () => void
  userId: string
  userRole: 'customer' | 'vendor' | 'delivery'
  userName: string
  currentBalance: number
  initialType?: WalletTxType
}) {
  const [type, setType] = useState<WalletTxType>(initialType)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    setType(initialType); setAmount(''); setDescription('')
  }, [open, userId, initialType])

  const submit = () => {
    const amt = Number(amount)
    if (!amt || amt <= 0) return
    walletActions.adjust(
      userId,
      userRole,
      type,
      amt,
      description || (type === 'credit' ? 'Admin top-up' : 'Admin debit'),
    )
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Adjust Wallet" description={`${userName} — current balance: ${formatCurrency(currentBalance)}`}>
      <div className="space-y-4">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setType('credit')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${type === 'credit' ? 'bg-emerald-600 text-white' : 'bg-background hover:bg-muted'}`}
          >
            + Add Funds
          </button>
          <button
            onClick={() => setType('debit')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${type === 'debit' ? 'bg-rose-600 text-white' : 'bg-background hover:bg-muted'}`}
          >
            − Deduct Funds
          </button>
        </div>
        <Field label="Amount ₹" value={amount} onChange={setAmount} type="number" placeholder="500" />
        <TextareaField label="Description (optional)" value={description} onChange={setDescription} placeholder="Bonus credit / Adjustment for order #ORD-1001" />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Cancel</button>
          <PrimaryButton onClick={submit}>
            <Wallet className="h-4 w-4" />
            {type === 'credit' ? 'Add Funds' : 'Deduct Funds'}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  Wallet Detail Modal — shows balance + transactions + adjust       */
/* ------------------------------------------------------------------ */

export function WalletDetailModal({
  open, onClose, userId, userRole, userName, currentBalance,
}: {
  open: boolean
  onClose: () => void
  userId: string
  userRole: 'customer' | 'vendor' | 'delivery'
  userName: string
  currentBalance: number
}) {
  const txs = useAdminState(() => walletActions.transactionsByUser(userId))
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustType, setAdjustType] = useState<WalletTxType>('credit')

  return (
    <>
      <Modal open={open} onClose={onClose} title="Wallet" description={userName} size="lg">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-xl p-5">
            <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide">Current Balance</p>
            <p className="text-3xl font-bold text-emerald-900 mt-1">{formatCurrency(currentBalance)}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => { setAdjustType('credit'); setAdjustOpen(true) }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus className="h-3 w-3" /> Add Funds
              </button>
              <button
                onClick={() => { setAdjustType('debit'); setAdjustOpen(true) }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3 w-3" /> Deduct
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Transaction History</p>
            <div className="max-h-72 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {txs.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground text-center">No transactions yet</p>
              )}
              {txs.map((t) => (
                <div key={t.id} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-foreground capitalize">{t.source} · {t.type}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${t.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'credit' ? '+' : '−'} {formatCurrency(t.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">Bal: {formatCurrency(t.balance_after)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Close</button>
          </div>
        </div>
      </Modal>
      <WalletAdjustModal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        userId={userId}
        userRole={userRole}
        userName={userName}
        currentBalance={currentBalance}
        initialType={adjustType}
      />
    </>
  )
}
