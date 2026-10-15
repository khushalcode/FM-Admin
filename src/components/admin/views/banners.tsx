'use client'

import { useState, useMemo, useEffect } from 'react'
import { Image, Plus, Edit, Trash2, ExternalLink, MoveUp, MoveDown, Eye, ImageOff } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, SearchInput, EmptyState, StatusBadge, FilterChips,
  ImageUpload, SwButton, SwIconButton, SwCard, SwPageHeader, SwBadge,
  ConfirmButton, Modal, Field, SelectField, Toggle,
} from '../shared'
import { useAdminState, bannerActions } from '@/lib/admin-data'
import { Banner } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function BannersView() {
  const banners = useAdminState((s) => s.banners)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)

  const filtered = useMemo(() => {
    return banners.filter((b) => {
      if (statusFilter === 'active' && !b.is_active) return false
      if (statusFilter === 'inactive' && b.is_active) return false
      if (search) return b.title.toLowerCase().includes(search.toLowerCase())
      return true
    })
  }, [banners, search, statusFilter])

  const handleDelete = (b: Banner) => {
    bannerActions.remove(b.id)
    toast.success('Banner deleted', { description: b.title })
  }

  const handleToggle = (b: Banner) => {
    bannerActions.update(b.id, { is_active: !b.is_active })
    toast.success(`Banner ${b.is_active ? 'deactivated' : 'activated'}`)
  }

  const moveUp = (b: Banner) => bannerActions.update(b.id, { position: Math.max(1, b.position - 1) })
  const moveDown = (b: Banner) => bannerActions.update(b.id, { position: b.position + 1 })

  return (
    <div>
      <SwPageHeader
        title="All Banners"
        subtitle={`${filtered.length} of ${banners.length} banners`}
        actions={
          <SwButton onClick={() => { setEditing(null); setAddOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add New Banner
          </SwButton>
        }
      />

      <SwCard padding="sm" className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3 p-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search banners..." className="flex-1" />
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
      </SwCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((b) => (
          <SwCard key={b.id} padding="none" className="overflow-hidden group">
            <div className="relative h-36 bg-slate-100">
              {b.image_url ? (
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <ImageOff className="h-8 w-8" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <button onClick={() => handleToggle(b)}>
                  <SwBadge color={b.is_active ? 'green' : 'slate'}>
                    {b.is_active ? 'Active' : 'Inactive'}
                  </SwBadge>
                </button>
              </div>
              <div className="absolute top-2 left-2 flex gap-1">
                <button onClick={() => moveUp(b)} className="h-7 w-7 rounded-md bg-white/80 backdrop-blur flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-white">
                  <MoveUp className="h-3 w-3" />
                </button>
                <button onClick={() => moveDown(b)} className="h-7 w-7 rounded-md bg-white/80 backdrop-blur flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-white">
                  <MoveDown className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-slate-900 text-sm mb-2 line-clamp-1">{b.title}</h3>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <p className="text-slate-500">Position</p>
                  <p className="font-medium text-slate-900">#{b.position}</p>
                </div>
                <div>
                  <p className="text-slate-500">Redirect</p>
                  <p className="font-medium text-slate-900 capitalize flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> {b.redirect_type}
                  </p>
                </div>
                {b.start_date && (
                  <div>
                    <p className="text-slate-500">Start</p>
                    <p className="font-medium text-slate-900">{new Date(b.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {b.end_date && (
                  <div>
                    <p className="text-slate-500">End</p>
                    <p className="font-medium text-slate-900">{new Date(b.end_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 pt-3 border-t border-slate-200">
                <SwIconButton icon={Eye} onClick={() => { setEditing(b); setAddOpen(true) }} label="View" tone="primary" />
                <SwIconButton icon={Edit} onClick={() => { setEditing(b); setAddOpen(true) }} label="Edit" tone="primary" />
                <SwIconButton icon={Trash2} onClick={() => handleDelete(b)} label="Delete" tone="danger" />
              </div>
            </div>
          </SwCard>
        ))}
      </div>

      {filtered.length === 0 && (
        <SwCard>
          <EmptyState icon={Image} title="No banners found" />
        </SwCard>
      )}

      <BannerModal open={addOpen} onClose={() => { setAddOpen(false); setEditing(null) }} editing={editing} />
    </div>
  )
}

function BannerModal({
  open, onClose, editing,
}: {
  open: boolean
  onClose: () => void
  editing?: Banner | null
}) {
  const banners = useAdminState((s) => s.banners)
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [redirectType, setRedirectType] = useState<Banner['redirect_type']>('none')
  const [redirectUrl, setRedirectUrl] = useState('')
  const [position, setPosition] = useState('')
  const [endDate, setEndDate] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (editing) {
      setTitle(editing.title); setImageUrl(editing.image_url || '')
      setRedirectType(editing.redirect_type); setRedirectUrl(editing.redirect_url || '')
      setPosition(String(editing.position))
      setEndDate(editing.end_date ? editing.end_date.slice(0, 10) : '')
      setActive(editing.is_active)
    } else {
      setTitle(''); setImageUrl(''); setRedirectType('none'); setRedirectUrl('')
      setPosition(String(banners.length + 1)); setEndDate(''); setActive(true)
    }
  }, [editing, open])

  const submit = () => {
    if (!title.trim()) {
      toast.error('Banner title is required')
      return
    }
    if (!imageUrl) {
      toast.error('Banner image is mandatory — please upload an image')
      return
    }
    const payload = {
      title, image_url: imageUrl,
      redirect_type: redirectType,
      redirect_url: redirectUrl || undefined,
      position: Number(position) || banners.length + 1,
      end_date: endDate ? new Date(endDate).toISOString() : undefined,
      is_active: active,
    }
    if (editing) {
      bannerActions.update(editing.id, payload)
      toast.success('Banner updated', { description: title })
    } else {
      bannerActions.create(payload)
      toast.success('Banner created', { description: title })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Banner' : 'Add New Banner'} size="lg">
      <div className="space-y-4">
        <ImageUpload
          label="Banner Image"
          value={imageUrl}
          onChange={setImageUrl}
          required
          description="JPG, JPEG, PNG, GIF · Max 2MB · 2:1 ratio"
          maxSizeMB={2}
          aspect="wide"
        />
        <Field label="Title *" value={title} onChange={setTitle} placeholder="50% off your first order" />
        <SelectField
          label="Redirect Type"
          value={redirectType}
          onChange={(v) => setRedirectType(v as Banner['redirect_type'])}
          options={[
            { value: 'none', label: 'None' },
            { value: 'store', label: 'Store' },
            { value: 'category', label: 'Category' },
            { value: 'product', label: 'Product' },
            { value: 'url', label: 'URL' },
          ]}
        />
        {redirectType === 'url' && (
          <Field label="Redirect URL" value={redirectUrl} onChange={setRedirectUrl} placeholder="/coupons" />
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Position" value={position} onChange={setPosition} type="number" />
          <Field label="End Date" value={endDate} onChange={setEndDate} type="date" />
        </div>
        <Toggle label="Active" checked={active} onChange={setActive} />
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <SwButton variant="outline" onClick={onClose}>Cancel</SwButton>
          <SwButton onClick={submit}>{editing ? 'Save Changes' : 'Submit'}</SwButton>
        </div>
      </div>
    </Modal>
  )
}
