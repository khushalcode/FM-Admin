'use client'

import { useState, useMemo, useEffect } from 'react'
import { Package, Plus, Edit, Trash2, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, SearchInput, EmptyState, StatusBadge,
  PrimaryButton, IconButton, ConfirmButton, Modal,
  Field, SelectField, TextareaField, Toggle,
  formatCurrency,
} from '../shared'
import { useAdminState, productActions } from '@/lib/admin-data'
import { Product } from '@/lib/types'
import { toast } from 'sonner'

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
      <PageHeader
        title="Products"
        subtitle={`${filtered.length} of ${products.length} products`}
        actions={
          <PrimaryButton onClick={() => { setEditing(null); setAddOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Product
          </PrimaryButton>
        }
      />

      <Card className="p-4 mb-4 premium-shadow border-border/50">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products by name or brand..."
            className="flex-1"
          />
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="all">All Stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['all', 'available', 'unavailable'] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAvailabilityFilter(a)}
                className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${availabilityFilter === a ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              >
                {a === 'all' ? 'All' : a}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['all', 'featured', 'regular'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFeaturedFilter(f)}
                className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${featuredFilter === f ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p) => {
          const store = stores.find(s => s.id === p.store_id)
          const cat = categories.find(c => c.id === p.category_id)
          return (
            <Card key={p.id} className="overflow-hidden premium-shadow border-border/50 hover:premium-shadow-lg transition-shadow group">
              <div className="h-32 flex items-center justify-center bg-emerald-50">
                <span className="text-4xl opacity-60">{p.is_veg === false ? '🍗' : p.is_veg === true ? '🥗' : '🍽️'}</span>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  {p.is_veg !== undefined && (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${p.is_veg ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {p.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}
                    </span>
                  )}
                  {p.is_featured && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      ★ Featured
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 line-clamp-2">
                  {p.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {store?.name} · {cat?.name}
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">
                    <Star className="inline h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating}
                  </span>
                  <span className="text-xs text-muted-foreground">· {p.reviews_count} reviews</span>
                </div>

                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {formatCurrency(p.discount_price ?? p.price)}
                    </p>
                    {p.discount_price && (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatCurrency(p.price)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">per {p.unit}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={p.is_available ? 'active' : 'inactive'} label={p.is_available ? 'Available' : 'Hidden'} />
                    <p className={`text-xs mt-1 ${p.stock < 50 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                      {p.stock} in stock
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditing(p); setAddOpen(true) }}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted"
                  >
                    <Edit className="h-3 w-3" /> Edit
                  </button>
                  <ConfirmButton
                    trigger={
                      <button className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-md border border-border text-rose-600 hover:bg-rose-50">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    }
                    title="Delete product?"
                    description={`This will remove ${p.name}.`}
                    onConfirm={() => handleDelete(p)}
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
            icon={Package}
            title="No products found"
            description="Try adjusting filters or add a new product"
            action={<PrimaryButton onClick={() => { setEditing(null); setAddOpen(true) }}><Plus className="h-4 w-4" /> Add Product</PrimaryButton>}
          />
        </Card>
      )}

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
    } else {
      setName(''); setStoreId(stores[0]?.id || ''); setCategoryId(categories[0]?.id || '')
      setPrice(''); setDiscountPrice(''); setUnit('pcs'); setStock('0')
      setBrand(''); setBarcode(''); setIsVeg(undefined); setPrepTime('')
      setDescription(''); setAvailable(true); setFeatured(false)
    }
  }, [editing, open])

  const submit = () => {
    if (!name.trim() || !storeId || !price) return
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
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
      <div className="space-y-4">
        <Field label="Product Name" value={name} onChange={setName} placeholder="Chicken Biryani" />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Store" value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
          <SelectField label="Category" value={categoryId} onChange={setCategoryId} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        </div>
        <TextareaField label="Description" value={description} onChange={setDescription} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Price ₹" value={price} onChange={setPrice} type="number" />
          <Field label="Discount ₹" value={discountPrice} onChange={setDiscountPrice} type="number" />
          <Field label="Unit" value={unit} onChange={setUnit} />
          <Field label="Stock" value={stock} onChange={setStock} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Brand (optional)" value={brand} onChange={setBrand} />
          <Field label="Barcode (optional)" value={barcode} onChange={setBarcode} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Veg / Non-Veg"
            value={isVeg === undefined ? '' : String(isVeg)}
            onChange={(v) => setIsVeg(v === '' ? undefined : v === 'true')}
            options={[
              { value: '', label: 'N/A' },
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
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Cancel</button>
          <PrimaryButton onClick={submit}>{editing ? 'Save Changes' : 'Create Product'}</PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}
