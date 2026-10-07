'use client'

import { useState, useMemo, useEffect } from 'react'
import { Tag, Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  PageHeader, SearchInput, EmptyState, StatusBadge,
  PrimaryButton, IconButton, ConfirmButton, Modal, Field, Toggle,
} from '../shared'
import { useAdminState, categoryActions } from '@/lib/admin-data'
import { Category } from '@/lib/types'
import { toast } from 'sonner'

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
      <PageHeader
        title="Categories"
        subtitle={`${filtered.length} of ${categories.length} categories`}
        actions={
          <PrimaryButton onClick={() => { setEditing(null); setAddOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add Category
          </PrimaryButton>
        }
      />

      <Card className="p-4 mb-4 premium-shadow border-border/50">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search categories..."
            className="flex-1"
          />
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['all', 'active', 'inactive'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveFilter(m)}
                className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${activeFilter === m ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="premium-shadow border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Position</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Category</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Stores</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Items</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground w-6">#{c.position}</span>
                      <IconButton icon={ArrowUp} onClick={() => moveUp(c)} label="Up" />
                      <IconButton icon={ArrowDown} onClick={() => moveDown(c)} label="Down" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-emerald-50 text-lg">
                        🍽️
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">/{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{c.stores_count}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{c.items_count}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <IconButton icon={Edit} onClick={() => { setEditing(c); setAddOpen(true) }} label="Edit" tone="primary" />
                      <ConfirmButton
                        trigger={<IconButton icon={Trash2} label="Delete" tone="danger" />}
                        title="Delete category?"
                        description={`This will remove ${c.name}.`}
                        onConfirm={() => handleDelete(c)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState
            icon={Tag}
            title="No categories found"
            description="Add your first category to organize products"
            action={<PrimaryButton onClick={() => { setEditing(null); setAddOpen(true) }}><Plus className="h-4 w-4" /> Add Category</PrimaryButton>}
          />
        )}
      </Card>

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

  useEffect(() => {
    if (editing) {
      setName(editing.name)
      setPosition(String(editing.position))
      setActive(editing.is_active)
    } else {
      setName('')
      setPosition(String(categories.length + 1))
      setActive(true)
    }
  }, [editing, open])

  const submit = () => {
    if (!name.trim()) return
    const payload = {
      name,
      position: Number(position) || categories.length + 1,
      is_active: active,
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
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Category' : 'Add Category'}>
      <div className="space-y-4">
        <Field label="Category Name" value={name} onChange={setName} placeholder="Biryani" />
        <Field label="Position (display order)" value={position} onChange={setPosition} type="number" />
        <Toggle label="Active" checked={active} onChange={setActive} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Cancel</button>
          <PrimaryButton onClick={submit}>{editing ? 'Save Changes' : 'Create Category'}</PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}
