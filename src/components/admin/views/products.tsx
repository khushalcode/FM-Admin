'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Package, Plus, Edit, Trash2, Star, Eye, ImageOff,
} from 'lucide-react'
import {
  PageHeader, SearchInput, EmptyState, StatusBadge,
  PrimaryButton, OutlineButton, ConfirmButton, Modal,
  Field, SelectField, TextareaField, Toggle,
  ImageUpload, SwButton, SwIconButton, SwCard, SwPageHeader, SwBadge, SwSectionLabel,
  formatCurrency,
} from '../shared'
import { useAdminState, productActions } from '@/lib/admin-data'
import { Product } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function ProductsView() {
  const products = useAdminState((s) => s.products)
  const stores = useAdminState((s) => s.stores)
  const categories = useAdminState((s) => s.categories)
  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all')
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'regular'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (storeFilter !== 'all' && p.store_id !== storeFilter) return false
      if (availabilityFilter === 'available' && !p.is_available) return false
      if (availabilityFilter === 'unavailable' && p.is_available) return false
      if (featuredFilter === 'featured' && !p.is_featured) return false
      if (featuredFilter === 'regular' && p.is_featured) return false
      if (search) {
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q))
      }
      return true
    })
  }, [products, search, storeFilter, availabilityFilter, featuredFilter])

  const handleDelete = (p: Product) => {
    productActions.remove(p.id)
    toast.success('Product deleted', { description: p.name })
  }

  return (
    <div>
      <SwPageHeader
        title="Restaurant Foods List"
        subtitle={`${filtered.length} of ${products.length} products`}
        actions={
          <SwButton onClick={() => { setEditing(null); setAddOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Product
          </SwButton>
        }
      />

      <SwCard padding="sm" className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap p-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products by name or brand..."
            className="flex-1"
          />
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            {(['all', 'available', 'unavailable'] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAvailabilityFilter(a)}
                className={cn(
                  'px-3 py-2 text-xs font-medium capitalize transition-colors',
                  availabilityFilter === a ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {a === 'all' ? 'All' : a}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            {(['all', 'featured', 'regular'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFeaturedFilter(f)}
                className={cn(
                  'px-3 py-2 text-xs font-medium capitalize transition-colors',
                  featuredFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>
      </SwCard>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Image', 'Name', 'Store', 'Category', 'Price', 'Stock', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => {
              const store = stores.find(s => s.id === p.store_id)
              const cat = categories.find(c => c.id === p.category_id)
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageOff className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        {p.is_veg !== undefined && (
                          <span className={cn('text-[10px] font-semibold', p.is_veg ? 'text-emerald-600' : 'text-red-600')}>
                            {p.is_veg ? '● Veg' : '● Non-Veg'}
                          </span>
                        )}
                      </div>
                      {p.is_featured && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">★</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{store?.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{cat?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900">{formatCurrency(p.discount_price ?? p.price)}</span>
                    {p.discount_price && (
                      <span className="ml-1 text-xs text-slate-400 line-through">{formatCurrency(p.price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-semibold', p.stock < 50 ? 'text-red-600' : 'text-slate-600')}>
                      {p.stock} in stock
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <SwBadge color={p.is_available ? 'green' : 'slate'}>
                      {p.is_available ? 'Available' : 'Hidden'}
                    </SwBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <SwIconButton
                        icon={Eye}
                        label="View"
                        tone="primary"
                        onClick={() => { setEditing(p); setAddOpen(true) }}
                      />
                      <SwIconButton
                        icon={Edit}
                        label="Edit"
                        tone="primary"
                        onClick={() => { setEditing(p); setAddOpen(true) }}
                      />
                      <ConfirmButton
                        trigger={
                          <button
                            type="button"
                            aria-label="Delete"
                            title="Delete"
                            className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        }
                        title="Delete product?"
                        description={`This will remove ${p.name}. This action cannot be undone.`}
                        onConfirm={() => handleDelete(p)}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <EmptyState
                    icon={Package}
                    title="No products found"
                    description="Try adjusting filters or add a new product"
                    action={<SwButton onClick={() => { setEditing(null); setAddOpen(true) }}><Plus className="h-4 w-4" /> Add Product</SwButton>}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditing(null) }}
        editing={editing}
      />
    </div>
  )
}

function ProductModal({
  open, onClose, editing,
}: {
  open: boolean
  onClose: () => void
  editing?: Product | null
}) {
  const stores = useAdminState((s) => s.stores)
  const categories = useAdminState((s) => s.categories)
  const [name, setName] = useState('')
  const [storeId, setStoreId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [unit, setUnit] = useState('pcs')
  const [stock, setStock] = useState('0')
  const [brand, setBrand] = useState('')
  const [barcode, setBarcode] = useState('')
  const [isVeg, setIsVeg] = useState<boolean | undefined>(undefined)
  const [prepTime, setPrepTime] = useState('')
  const [description, setDescription] = useState('')
  const [available, setAvailable] = useState(true)
  const [featured, setFeatured] = useState(false)
  // MANDATORY image upload — products cannot be created without an image
  const [imageUrl, setImageUrl] = useState('')
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (editing) {
      setName(editing.name)
      setStoreId(editing.store_id)
      setCategoryId(editing.category_id)
      setPrice(String(editing.price))
      setDiscountPrice(editing.discount_price ? String(editing.discount_price) : '')
      setUnit(editing.unit)
      setStock(String(editing.stock))
      setBrand(editing.brand || '')
      setBarcode(editing.barcode || '')
      setIsVeg(editing.is_veg)
      setPrepTime(editing.prep_time_minutes ? String(editing.prep_time_minutes) : '')
      setDescription(editing.description || '')
      setAvailable(editing.is_available)
      setFeatured(editing.is_featured)
      setImageUrl(editing.image_url || '')
      setImageError(false)
    } else {
      setName(''); setStoreId(stores[0]?.id || ''); setCategoryId(categories[0]?.id || '')
      setPrice(''); setDiscountPrice(''); setUnit('pcs'); setStock('0')
      setBrand(''); setBarcode(''); setIsVeg(undefined); setPrepTime('')
      setDescription(''); setAvailable(true); setFeatured(false)
      setImageUrl(''); setImageError(false)
    }
  }, [editing, open])

  const submit = () => {
    // Validate mandatory fields
    if (!name.trim()) { toast.error('Product name is required'); return }
    if (!storeId) { toast.error('Store is required'); return }
    if (!categoryId) { toast.error('Category is required'); return }
    if (!price) { toast.error('Price is required'); return }
    // MANDATORY IMAGE UPLOAD
    if (!imageUrl) {
      setImageError(true)
      toast.error('Product image is mandatory — please upload an image before saving')
      return
    }
    const payload = {
      name,
      store_id: storeId,
      category_id: categoryId,
      price: Number(price) || 0,
      discount_price: discountPrice ? Number(discountPrice) : null,
      unit, stock: Number(stock) || 0,
      brand: brand || undefined,
      barcode: barcode || undefined,
      is_veg: isVeg,
      prep_time_minutes: prepTime ? Number(prepTime) : undefined,
      description,
      is_available: available,
      is_featured: featured,
      image_url: imageUrl,
    }
    if (editing) {
      productActions.update(editing.id, payload)
      toast.success('Product updated', { description: name })
    } else {
      productActions.create(payload)
      toast.success('Product created', { description: name })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Product' : 'Add Product'} size="xl">
      <div className="space-y-4">
        <SwSectionLabel>Product Information</SwSectionLabel>

        {/* MANDATORY image upload */}
        <ImageUpload
          label="Product Image"
          value={imageUrl}
          onChange={(v) => { setImageUrl(v); setImageError(false) }}
          required
          description="PNG, JPG, WEBP up to 5MB"
          maxSizeMB={5}
          aspect="square"
        />
        {imageError && (
          <p className="text-xs text-red-600 -mt-2">
            Product image is mandatory. Please upload an image to continue.
          </p>
        )}

        <Field label="Product Name *" value={name} onChange={setName} placeholder="Chicken Biryani" />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Store *" value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
          <SelectField label="Category *" value={categoryId} onChange={setCategoryId} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        </div>
        <TextareaField label="Description" value={description} onChange={setDescription} />

        <SwSectionLabel className="mt-4">Pricing & Inventory</SwSectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Price ₹ *" value={price} onChange={setPrice} type="number" />
          <Field label="Discount ₹" value={discountPrice} onChange={setDiscountPrice} type="number" />
          <Field label="Unit *" value={unit} onChange={setUnit} />
          <Field label="Stock *" value={stock} onChange={setStock} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Brand (optional)" value={brand} onChange={setBrand} />
          <Field label="Barcode (optional)" value={barcode} onChange={setBarcode} />
        </div>

        <SwSectionLabel className="mt-4">Additional Information</SwSectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Veg / Non-Veg *"
            value={isVeg === undefined ? '' : String(isVeg)}
            onChange={(v) => setIsVeg(v === '' ? undefined : v === 'true')}
            options={[
              { value: '', label: 'Select diet type' },
              { value: 'true', label: '🟢 Veg' },
              { value: 'false', label: '🔴 Non-Veg' },
            ]}
          />
          <Field label="Prep Time (min)" value={prepTime} onChange={setPrepTime} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Available" checked={available} onChange={setAvailable} />
          <Toggle label="Featured" checked={featured} onChange={setFeatured} />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <SwButton variant="outline" onClick={onClose}>Cancel</SwButton>
          <SwButton onClick={submit}>
            {editing ? 'Save Changes' : 'Create Product'}
          </SwButton>
        </div>
      </div>
    </Modal>
  )
}
