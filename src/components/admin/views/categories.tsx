'use client'

import { useState, useMemo, useEffect } from 'react'
import { Tag, Plus, Edit, Trash2, ArrowUp, ArrowDown, Eye, ImageOff } from 'lucide-react'
import {
  SearchInput, EmptyState,
  ConfirmButton, Modal, Field, Toggle,
  ImageUpload, SwButton, SwIconButton, SwCard, SwPageHeader, SwBadge,
} from '../shared'
import { useAdminState, categoryActions } from '@/lib/admin-data'
import { Category } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function CategoriesView() {
  const categories = useAdminState((s) => s.categories)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const filtered = useMemo(() => {
    return categories.filter((c) => {
      if (activeFilter === 'active' && !c.is_active) return false
      if (activeFilter === 'inactive' && c.is_active) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [categories, search, activeFilter])

  const handleDelete = (c: Category) => {
    categoryActions.remove(c.id)
    toast.success('Category deleted', { description: c.name })
  }

  const moveUp = (c: Category) => {
    const sorted = [...filtered].sort((a, b) => a.position - b.position)
    const idx = sorted.findIndex((x) => x.id === c.id)
    if (idx > 0) {
      const prev = sorted[idx - 1]
      categoryActions.update(c.id, { position: prev.position })
      categoryActions.update(prev.id, { position: c.position })
    }
  }
  const moveDown = (c: Category) => {
    const sorted = [...filtered].sort((a, b) => a.position - b.position)
    const idx = sorted.findIndex((x) => x.id === c.id)
    if (idx < sorted.length - 1) {
      const next = sorted[idx + 1]
      categoryActions.update(c.id, { position: next.position })
      categoryActions.update(next.id, { position: c.position })
    }
  }

  return (
    <div>
      <SwPageHeader
        title="Categories"
        subtitle={`${filtered.length} of ${categories.length} categories`}
        actions={
          <SwButton onClick={() => { setEditing(null); setAddOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Category
          </SwButton>
        }
      />

      <SwCard padding="sm" className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3 p-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search categories..."
            className="flex-1"
          />
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            {(['all', 'active', 'inactive'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveFilter(m)}
                className={cn(
                  'px-3 py-2 text-xs font-medium capitalize transition-colors',
                  activeFilter === m ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </SwCard>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Position', 'Category Image', 'Category Name', 'Stores', 'Items', 'Status', 'Action'].map((h) => (
                <th key={h} className={cn('px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap', h === 'Stores' || h === 'Items' ? 'text-right' : '')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 w-6">#{c.position}</span>
                    <SwIconButton icon={ArrowUp} onClick={() => moveUp(c)} label="Move up" tone="default" />
                    <SwIconButton icon={ArrowDown} onClick={() => moveDown(c)} label="Move down" tone="default" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                    {c.icon_url ? (
                      <img src={c.icon_url} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">/{c.slug}</p>
                </td>
                <td className="px-4 py-3 text-right text-slate-600">{c.stores_count}</td>
                <td className="px-4 py-3 text-right text-slate-600">{c.items_count}</td>
                <td className="px-4 py-3">
                  <SwBadge color={c.is_active ? 'green' : 'slate'}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </SwBadge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <SwIconButton icon={Eye} onClick={() => { setEditing(c); setAddOpen(true) }} label="View" tone="primary" />
                    <SwIconButton icon={Edit} onClick={() => { setEditing(c); setAddOpen(true) }} label="Edit" tone="primary" />
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
                      title="Delete category?"
                      description={`This will remove ${c.name}. This action cannot be undone.`}
                      onConfirm={() => handleDelete(c)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <EmptyState
                    icon={Tag}
                    title="No categories found"
                    description="Add your first category to organize products"
                    action={<SwButton onClick={() => { setEditing(null); setAddOpen(true) }}><Plus className="h-4 w-4" /> Add Category</SwButton>}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CategoryModal open={addOpen} onClose={() => { setAddOpen(false); setEditing(null) }} editing={editing} />
    </div>
  )
}

function CategoryModal({
  open, onClose, editing,
}: {
  open: boolean
  onClose: () => void
  editing?: Category | null
}) {
  const categories = useAdminState((s) => s.categories)
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [active, setActive] = useState(true)
  // Mandatory category icon image
  const [iconUrl, setIconUrl] = useState('')

  useEffect(() => {
    if (editing) {
      setName(editing.name)
      setPosition(String(editing.position))
      setActive(editing.is_active)
      setIconUrl(editing.icon_url || '')
    } else {
      setName('')
      setPosition(String(categories.length + 1))
      setActive(true)
      setIconUrl('')
    }
  }, [editing, open])

  const submit = () => {
    if (!name.trim()) {
      toast.error('Category name is required')
      return
    }
    if (!iconUrl) {
      toast.error('Category image is mandatory — please upload an icon image')
      return
    }
    const payload = {
      name,
      position: Number(position) || categories.length + 1,
      is_active: active,
      icon_url: iconUrl,
    }
    if (editing) {
      categoryActions.update(editing.id, payload)
      toast.success('Category updated', { description: name })
    } else {
      categoryActions.create(payload)
      toast.success('Category created', { description: name })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Category' : 'Add Category'} size="lg">
      <div className="space-y-4">
        <ImageUpload
          label="Category Image"
          value={iconUrl}
          onChange={setIconUrl}
          required
          description="PNG, JPG up to 2MB · 1:1 ratio recommended"
          maxSizeMB={2}
          aspect="square"
        />
        <Field label="Category Name *" value={name} onChange={setName} placeholder="Biryani" />
        <Field label="Position (display order)" value={position} onChange={setPosition} type="number" />
        <Toggle label="Active" checked={active} onChange={setActive} />
        <div className="flex justify-end gap-2 pt-2">
          <SwButton variant="outline" onClick={onClose}>Cancel</SwButton>
          <SwButton onClick={submit}>{editing ? 'Save Changes' : 'Create Category'}</SwButton>
        </div>
      </div>
    </Modal>
  )
}
