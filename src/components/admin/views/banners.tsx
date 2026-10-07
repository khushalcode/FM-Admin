'use client'

import { useState, useMemo, useEffect } from 'react'
import { Image, Plus, Edit, Trash2, ExternalLink, MoveUp, MoveDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, SearchInput, EmptyState, StatusBadge, FilterChips,
  PrimaryButton, IconButton, ConfirmButton, Modal, Field, SelectField, Toggle,
} from '../shared'
import { useAdminState, bannerActions } from '@/lib/admin-data'
import { Banner } from '@/lib/types'
import { toast } from 'sonner'

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
      <PageHeader
        title="Banners"
        subtitle={`${filtered.length} of ${banners.length} banners`}
        actions={
          <PrimaryButton onClick={() => { setEditing(null); setAddOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Banner
          </PrimaryButton>
        }
      />

      <Card className="p-4 mb-4 premium-shadow border-border/50">
        <div className="flex flex-col sm:flex-row gap-3">
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
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((b) => (
          <Card key={b.id} className="overflow-hidden premium-shadow border-border/50 group">
            <div className="relative h-36 flex items-center justify-center bg-gradient-to-r from-emerald-100 to-emerald-50">
              <div className="text-center">
                <span className="text-3xl opacity-60 block mb-1">✨</span>
                <p className="text-sm font-semibold text-foreground/70 line-clamp-1 px-4">{b.title}</p>
              </div>
              <div className="absolute top-2 right-2">
                <button onClick={() => handleToggle(b)}>
                  <StatusBadge status={b.is_active ? 'active' : 'inactive'} />
                </button>
              </div>
              <div className="absolute top-2 left-2 flex gap-1">
                <button onClick={() => moveUp(b)} className="h-7 w-7 rounded-md bg-background/80 flex items-center justify-center text-muted-foreground hover:text-primary">
                  <MoveUp className="h-3 w-3" />
                </button>
                <button onClick={() => moveDown(b)} className="h-7 w-7 rounded-md bg-background/80 flex items-center justify-center text-muted-foreground hover:text-primary">
                  <MoveDown className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-1">{b.title}</h3>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <p className="text-muted-foreground">Position</p>
                  <p className="font-medium text-foreground">#{b.position}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Redirect</p>
                  <p className="font-medium text-foreground capitalize flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> {b.redirect_type}
                  </p>
                </div>
                {b.start_date && (
                  <div>
                    <p className="text-muted-foreground">Start</p>
                    <p className="font-medium text-foreground">{new Date(b.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {b.end_date && (
                  <div>
                    <p className="text-muted-foreground">End</p>
                    <p className="font-medium text-foreground">{new Date(b.end_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditing(b); setAddOpen(true) }}
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
                  title="Delete banner?"
                  description={`This will remove "${b.title}".`}
                  onConfirm={() => handleDelete(b)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="premium-shadow border-border/50">
          <EmptyState icon={Image} title="No banners found" />
        </Card>
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
    if (!title.trim()) return
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
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Banner' : 'Add Banner'}>
      <div className="space-y-4">
        <Field label="Title" value={title} onChange={setTitle} placeholder="50% off your first order" />
        <Field label="Image URL (optional)" value={imageUrl} onChange={setImageUrl} placeholder="https://..." />
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
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Cancel</button>
          <PrimaryButton onClick={submit}>{editing ? 'Save Changes' : 'Create Banner'}</PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}
