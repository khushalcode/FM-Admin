'use client'

import { useState, useMemo, useEffect } from 'react'
import { Ticket, Plus, Edit, Trash2, Copy, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, SearchInput, EmptyState, StatusBadge, FilterChips,
  PrimaryButton, IconButton, ConfirmButton, Modal, Field, SelectField, Toggle,
  formatNumber, formatCurrency,
} from '../shared'
import { useAdminState, couponActions } from '@/lib/admin-data'
import { Coupon } from '@/lib/types'
import { toast } from 'sonner'

export function CouponsView() {
  const coupons = useAdminState((s) => s.coupons)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (statusFilter === 'active' && !c.is_active) return false
      if (statusFilter === 'inactive' && c.is_active) return false
      if (search) {
        const q = search.toLowerCase()
        return c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
      }
      return true
    })
  }, [coupons, search, statusFilter])

  const handleDelete = (c: Coupon) => {
    couponActions.remove(c.id)
    toast.success('Coupon deleted', { description: c.code })
  }

  const handleToggle = (c: Coupon) => {
    couponActions.update(c.id, { is_active: !c.is_active })
    toast.success(`Coupon ${c.is_active ? 'deactivated' : 'activated'}`, { description: c.code })
  }

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle={`${filtered.length} of ${coupons.length} coupons`}
        actions={
          <PrimaryButton onClick={() => { setEditing(null); setAddOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Coupon
          </PrimaryButton>
        }
      />

      <Card className="p-4 mb-4 premium-shadow border-border/50">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search coupons by code or title..."
            className="flex-1"
          />
          <FilterChips
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <Card key={c.id} className="p-5 premium-shadow border-border/50 hover:premium-shadow-lg transition-shadow group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-foreground tracking-wider">{c.code}</span>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(c.code); toast.success('Copied to clipboard') }}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.title}</p>
                </div>
              </div>
              <button onClick={() => handleToggle(c)}>
                <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
              </button>
            </div>

            {c.description && <p className="text-sm text-muted-foreground mb-3">{c.description}</p>}

            <div className="bg-gradient-to-r from-emerald-50 to-amber-50 rounded-lg p-3 mb-3">
              <p className="text-2xl font-bold text-foreground">
                {c.discount_type === 'percentage'
                  ? `${c.discount_value}% OFF`
                  : `${formatCurrency(c.discount_value)} OFF`}
              </p>
              {c.maximum_discount && c.discount_type === 'percentage' && (
                <p className="text-xs text-muted-foreground mt-1">Up to {formatCurrency(c.maximum_discount)} off</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Min order: {formatCurrency(c.minimum_order)}</p>
            </div>

            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(c.start_date).toLocaleDateString()} → {new Date(c.end_date).toLocaleDateString()}
              </span>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">Usage</span>
                <span className="font-medium text-foreground">
                  {formatNumber(c.used_count)} / {formatNumber(c.usage_limit)}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min((c.used_count / c.usage_limit) * 100, 100)}%` }} />
              </div>
            </div>

            <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setEditing(c); setAddOpen(true) }}
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
                title="Delete coupon?"
                description={`This will remove ${c.code}.`}
                onConfirm={() => handleDelete(c)}
              />
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="premium-shadow border-border/50">
          <EmptyState icon={Ticket} title="No coupons found" />
        </Card>
      )}

      <CouponModal open={addOpen} onClose={() => { setAddOpen(false); setEditing(null) }} editing={editing} />
    </div>
  )
}

function CouponModal({
  open, onClose, editing,
}: {
  open: boolean
  onClose: () => void
  editing?: Coupon | null
}) {
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [minimumOrder, setMinimumOrder] = useState('')
  const [maximumDiscount, setMaximumDiscount] = useState('')
  const [usageLimit, setUsageLimit] = useState('100')
  const [endDate, setEndDate] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (editing) {
      setCode(editing.code); setTitle(editing.title); setDescription(editing.description || '')
      setDiscountType(editing.discount_type); setDiscountValue(String(editing.discount_value))
      setMinimumOrder(String(editing.minimum_order))
      setMaximumDiscount(editing.maximum_discount ? String(editing.maximum_discount) : '')
      setUsageLimit(String(editing.usage_limit))
      setEndDate(editing.end_date ? editing.end_date.slice(0, 10) : '')
      setActive(editing.is_active)
    } else {
      setCode(''); setTitle(''); setDescription(''); setDiscountType('percentage'); setDiscountValue('')
      setMinimumOrder(''); setMaximumDiscount(''); setUsageLimit('100'); setEndDate(''); setActive(true)
    }
  }, [editing, open])

  const submit = () => {
    if (!code.trim() || !title.trim() || !discountValue) return
    const payload = {
      code, title, description: description || undefined,
      discount_type: discountType,
      discount_value: Number(discountValue) || 0,
      minimum_order: Number(minimumOrder) || 0,
      maximum_discount: maximumDiscount ? Number(maximumDiscount) : undefined,
      usage_limit: Number(usageLimit) || 100,
      end_date: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
      is_active: active,
    }
    if (editing) {
      couponActions.update(editing.id, payload)
      toast.success('Coupon updated', { description: code })
    } else {
      couponActions.create(payload)
      toast.success('Coupon created', { description: code })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Coupon' : 'Add Coupon'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Coupon Code" value={code} onChange={(v) => setCode(v.toUpperCase())} placeholder="WELCOME50" />
          <Field label="Title" value={title} onChange={setTitle} placeholder="50% off first order" />
        </div>
        <Field label="Description (optional)" value={description} onChange={setDescription} />
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Discount Type"
            value={discountType}
            onChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}
            options={[
              { value: 'percentage', label: 'Percentage' },
              { value: 'fixed', label: 'Fixed Amount' },
            ]}
          />
          <Field label={`Discount Value ${discountType === 'percentage' ? '%' : '₹'}`} value={discountValue} onChange={setDiscountValue} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Minimum Order ₹" value={minimumOrder} onChange={setMinimumOrder} type="number" />
          <Field label="Maximum Discount ₹ (optional)" value={maximumDiscount} onChange={setMaximumDiscount} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Usage Limit" value={usageLimit} onChange={setUsageLimit} type="number" />
          <Field label="End Date" value={endDate} onChange={setEndDate} type="date" />
        </div>
        <Toggle label="Active" checked={active} onChange={setActive} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Cancel</button>
          <PrimaryButton onClick={submit}>{editing ? 'Save Changes' : 'Create Coupon'}</PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}
