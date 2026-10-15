'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon, Search, X, Filter, Download, ImagePlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/* ------------------------------------------------------------------ */
/*  PageHeader                                                         */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  StatCard                                                           */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  hint,
  accent,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  hint?: string
  accent?: 'emerald' | 'amber' | 'rose' | 'blue' | 'violet'
}) {
  const accentClasses = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
  }
  const changeClasses = {
    up: 'text-emerald-600',
    down: 'text-rose-600',
    neutral: 'text-muted-foreground',
  }
  return (
    <Card className="p-5 premium-shadow border-border/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-semibold mt-2 text-foreground">
            {value}
          </p>
          {change && (
            <p className={cn('text-xs mt-2 font-medium', changeClasses[changeType])}>
              {change} {hint && <span className="text-muted-foreground">{hint}</span>}
            </p>
          )}
        </div>
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center',
          accentClasses[accent || 'emerald']
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  StatusBadge                                                        */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  preparing: 'bg-violet-100 text-violet-700 border-violet-200',
  ready: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  picked_up: 'bg-sky-100 text-sky-700 border-sky-200',
  on_the_way: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-100 text-rose-700 border-rose-200',
  refunded: 'bg-amber-100 text-amber-700 border-amber-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  open: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  blocked: 'bg-rose-100 text-rose-700 border-rose-200',
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const cls = STATUS_COLORS[status] || 'bg-zinc-100 text-zinc-600 border-zinc-200'
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      cls
    )}>
      {label || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  EmptyState                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SearchInput                                                        */
/* ------------------------------------------------------------------ */

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  FilterChips                                                        */
/* ------------------------------------------------------------------ */

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; count?: number }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
            value === o.value
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-muted-foreground hover:bg-muted border border-transparent'
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className="ml-1.5 text-muted-foreground/70">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ConfirmButton — uses AlertDialog                                   */
/* ------------------------------------------------------------------ */

export function ConfirmButton({
  trigger,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
}: {
  trigger: React.ReactNode
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <div onClick={(e) => { e.stopPropagation(); setOpen(true) }}>{trigger}</div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={async (e) => {
                e.preventDefault()
                setBusy(true)
                try {
                  await onConfirm()
                  setOpen(false)
                } finally {
                  setBusy(false)
                }
              }}
              className={destructive ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}
            >
              {busy ? 'Working…' : confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  PrimaryButton / OutlineButton / IconButton                         */
/* ------------------------------------------------------------------ */

export function PrimaryButton({
  children, onClick, className, type = 'button', disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  )
}

export function OutlineButton({
  children, onClick, className, disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  )
}

export function IconButton({
  icon: Icon, onClick, label, tone = 'default', className,
}: {
  icon: LucideIcon
  onClick?: (e: React.MouseEvent) => void
  label?: string
  tone?: 'default' | 'danger' | 'primary'
  className?: string
}) {
  const toneCls = {
    default: 'text-muted-foreground hover:text-foreground hover:bg-muted',
    danger: 'text-muted-foreground hover:text-rose-600 hover:bg-rose-50',
    primary: 'text-muted-foreground hover:text-primary hover:bg-primary/10',
  }[tone]
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        toneCls,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  ExportButton — downloads CSV                                       */
/* ------------------------------------------------------------------ */

export function ExportButton({
  rows, filename, label = 'Export CSV',
}: {
  rows: Array<Record<string, any>>
  filename: string
  label?: string
}) {
  const handle = () => {
    if (!rows.length) {
      alert('No data to export')
      return
    }
    const headers = Object.keys(rows[0])
    const escape = (v: any) => {
      const s = v === null || v === undefined ? '' : String(v)
      return `"${s.replace(/"/g, '""')}"`
    }
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Modal shell — used by all CRUD forms                              */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!open) return null
  const sizeCls = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size]
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full bg-background rounded-xl shadow-xl my-8',
          sizeCls
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  FormField primitives                                               */
/* ------------------------------------------------------------------ */

export function Field({
  label, value, onChange, placeholder, type = 'text', readOnly,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; readOnly?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          'w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors',
          readOnly ? 'bg-muted/50 font-mono text-xs' : 'bg-background'
        )}
      />
    </div>
  )
}

export function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export function Toggle({
  label, desc, checked, onChange,
}: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )
}

export function TextareaField({
  label, value, onChange, placeholder, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; rows?: number
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  formatCurrency / formatNumber / timeAgo                            */
/* ------------------------------------------------------------------ */

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n || 0)
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n || 0)
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

/* ------------------------------------------------------------------ */
/*  SwitchEats-style action button (rounded blue / red)                 */
/*  Matches food-backend-umber AddonsList / DeliverymanList            */
/* ------------------------------------------------------------------ */

export function SwButton({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled,
  className,
  type = 'button',
}: {
  variant?: 'primary' | 'danger' | 'outline' | 'ghost' | 'success'
  size?: 'xs' | 'sm' | 'md'
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  }
  const sizes = {
    xs: 'px-2 py-1 text-[11px]',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  SwitchEats-style icon action button                                 */
/*  Matches food-backend-umber p-1.5 rounded text-{color}-600          */
/* ------------------------------------------------------------------ */

export function SwIconButton({
  icon: Icon,
  onClick,
  label,
  tone = 'primary',
  className,
}: {
  icon: LucideIcon
  onClick?: (e: React.MouseEvent) => void
  label?: string
  tone?: 'primary' | 'danger' | 'default' | 'success'
  className?: string
}) {
  const tones = {
    primary: 'text-blue-600 hover:bg-blue-50',
    danger: 'text-red-600 hover:bg-red-50',
    success: 'text-emerald-600 hover:bg-emerald-50',
    default: 'text-slate-600 hover:bg-slate-100',
  }
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
      className={cn(
        'p-1.5 rounded transition-colors',
        tones[tone],
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  SwitchEats-style status badge                                      */
/*  Matches food-backend-umber px-2 py-1 rounded-full text-xs font-semibold
/* ------------------------------------------------------------------ */

export function SwBadge({
  children,
  color = 'slate',
}: {
  children: React.ReactNode
  color?: 'slate' | 'blue' | 'green' | 'red' | 'amber' | 'purple'
}) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
      colors[color],
    )}>
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  ImageUpload — MANDATORY image uploader with preview                */
/*  Mirrors food-backend-umber "Click to upload" / "Change Image"     */
/*  pattern from AddRestaurant / AddEmployee / Banners                 */
/* ------------------------------------------------------------------ */

export function ImageUpload({
  label,
  value,
  onChange,
  required = false,
  description,
  accept = 'image/*',
  maxSizeMB = 5,
  aspect = 'square',
}: {
  label: string
  value: string
  onChange: (dataUrl: string) => void
  required?: boolean
  description?: string
  accept?: string
  maxSizeMB?: number
  aspect?: 'square' | 'video' | 'wide'
}) {
  const [error, setError] = useState<string | null>(null)

  const handleFile = (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP)')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMB}MB`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      onChange(reader.result as string)
    }
    reader.onerror = () => setError('Failed to read file')
    reader.readAsDataURL(file)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const aspectClass = aspect === 'square' ? 'aspect-square' : aspect === 'video' ? 'aspect-video' : 'aspect-[2/1]'

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          'relative border-2 border-dashed rounded-lg overflow-hidden cursor-pointer transition-colors',
          error ? 'border-red-300 bg-red-50/30' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30',
          aspectClass,
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInput}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        {value ? (
          <div className="relative w-full h-full">
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur">
                Change Image
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); setError(null) }}
              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
              <ImagePlus className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-700">Click to upload</p>
            <p className="text-[10px] text-slate-500 mt-0.5">or drag and drop</p>
            {description && <p className="text-[10px] text-slate-400 mt-1">{description}</p>}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SwCard — food-backend-umber styled card                            */
/*  bg-white rounded-xl shadow-sm border border-slate-200 p-6          */
/* ------------------------------------------------------------------ */

export function SwCard({
  children,
  className,
  padding = 'md',
}: {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}) {
  const pads = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  return (
    <div className={cn(
      'bg-white rounded-xl shadow-sm border border-slate-200',
      pads[padding],
      className,
    )}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SwPageHeader — food-backend-umber style                            */
/* ------------------------------------------------------------------ */

export function SwPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SwSectionLabel — section header with bottom border                 */
/*  Used in AddRestaurant / AddEmployee to group fields                */
/* ------------------------------------------------------------------ */

export function SwSectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-3', className)}>
      {children}
    </h3>
  )
}

