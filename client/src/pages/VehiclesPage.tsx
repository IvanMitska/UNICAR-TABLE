import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Vehicle, VehicleStatus, VehicleFormData, Rental } from '@/types'
import clsx from 'clsx'
import SelectDropdown from '@/components/ui/SelectDropdown'
import DatePicker from '@/components/ui/DatePicker'
import VehicleMetadataEditor from '@/components/vehicles/VehicleMetadataEditor'
import { useAuth } from '@/context/AuthContext'
import { CountUp } from '@/components/ui/CountUp'
import {
  History, User, Info, Gauge, Banknote, Plus, Car, Search, CheckCircle2,
  KeyRound, Wrench, Calendar, SquarePen, Trash2, X, Globe,
  LayoutGrid, List, ArrowUpDown, Fuel, ShieldAlert,
} from 'lucide-react'

type SortKey = 'name' | 'price-desc' | 'price-asc' | 'year-desc' | 'mileage-asc'

const sortLabels: Record<SortKey, string> = {
  name: 'По названию',
  'price-desc': 'Дороже сначала',
  'price-asc': 'Дешевле сначала',
  'year-desc': 'Новее сначала',
  'mileage-asc': 'Меньше пробег',
}

const statusPill: Record<VehicleStatus, string> = {
  available: 'pill-success',
  rented: 'pill-info',
  maintenance: 'pill-warning',
  archived: 'pill-neutral',
}

// Days until a date (null if no date). Negative = already passed.
function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

// Soonest document concern: expired or expiring within 30 days.
function docWarning(v: Vehicle): { label: string; expired: boolean } | null {
  const items: { name: string; days: number | null }[] = [
    { name: 'Страховка', days: daysUntil(v.insuranceExpiry) },
    { name: 'Техосмотр', days: daysUntil(v.inspectionExpiry) },
  ]
  const concerning = items
    .filter((i) => i.days !== null && (i.days as number) <= 30)
    .sort((a, b) => (a.days as number) - (b.days as number))
  if (concerning.length === 0) return null
  const top = concerning[0]
  const d = top.days as number
  if (d < 0) return { label: `${top.name}: истекла`, expired: true }
  if (d === 0) return { label: `${top.name}: сегодня`, expired: true }
  return { label: `${top.name}: ${d} дн.`, expired: false }
}

const statusLabels: Record<VehicleStatus, string> = {
  available: 'Свободен',
  rented: 'В аренде',
  maintenance: 'На ТО',
  archived: 'В архиве',
}

const statusColors: Record<VehicleStatus, string> = {
  available: 'badge-success',
  rented: 'badge-info',
  maintenance: 'badge-warning',
  archived: 'badge-gray',
}

const fuelLabels: Record<string, string> = {
  petrol: 'Бензин',
  diesel: 'Дизель',
  electric: 'Электро',
  hybrid: 'Гибрид',
}

export default function VehiclesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [activeRentalsCount, setActiveRentalsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null)
  const [metadataVehicle, setMetadataVehicle] = useState<Vehicle | null>(null)
  const [view, setView] = useState<'grid' | 'list'>(() => (typeof localStorage !== 'undefined' && localStorage.getItem('vehiclesView') === 'list' ? 'list' : 'grid'))
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [onlyExpiring, setOnlyExpiring] = useState(false)
  const { canEdit } = useAuth()
  const canEditVehicles = canEdit('vehicle')

  useEffect(() => { localStorage.setItem('vehiclesView', view) }, [view])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const fetchData = async () => {
    try {
      const [vehiclesRes, rentalsRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/rentals/active'),
      ])
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json()
        setVehicles(data)
      }
      if (rentalsRes.ok) {
        const data = await rentalsRes.json()
        setActiveRentalsCount(data.length)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (data: VehicleFormData) => {
    try {
      const url = editingVehicle
        ? `/api/vehicles/${editingVehicle.id}`
        : '/api/vehicles'
      const method = editingVehicle ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        fetchData()
        setIsModalOpen(false)
        setEditingVehicle(null)
      }
    } catch (error) {
      console.error('Failed to save vehicle:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите архивировать это авто?')) return

    try {
      const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to delete vehicle:', error)
    }
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      search === '' ||
      vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || vehicle.status === statusFilter

    const matchesExpiring = !onlyExpiring || docWarning(vehicle) !== null

    return matchesSearch && matchesStatus && matchesExpiring
  })

  const displayedVehicles = [...filteredVehicles].sort((a, b) => {
    switch (sortBy) {
      case 'price-desc': return (b.rateMonthly || 0) - (a.rateMonthly || 0)
      case 'price-asc': return (a.rateMonthly || 0) - (b.rateMonthly || 0)
      case 'year-desc': return (b.year || 0) - (a.year || 0)
      case 'mileage-asc': return (a.mileage || 0) - (b.mileage || 0)
      default: return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`)
    }
  })

  // Stats
  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    rented: activeRentalsCount,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
  }

  // Vehicles with expiring/expired documents (insurance or inspection)
  const expiringVehicles = vehicles.filter(v => docWarning(v) !== null)

  const statusCount = (s: VehicleStatus | 'all') =>
    s === 'all' ? vehicles.length : vehicles.filter(v => v.status === s).length

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[112px] rounded-[18px] skeleton" />)}
        </div>
        <div className="h-11 rounded-xl skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-[240px] rounded-2xl skeleton" />)}
        </div>
      </div>
    )
  }

  const openVehicle = (vehicle: Vehicle) => ({
    onView: () => setViewingVehicle(vehicle),
    onEdit: () => { setEditingVehicle(vehicle); setIsModalOpen(true) },
    onDelete: () => handleDelete(vehicle.id),
    onOpenMetadata: () => setMetadataVehicle(vehicle),
  })

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 fade-up">
        <div>
          <p className="eyebrow mb-1.5">Автопарк</p>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[var(--ink)] leading-none">Автомобили</h1>
            <span className="pill pill-neutral">{vehicles.length}</span>
          </div>
        </div>
        {canEditVehicles && (
          <button onClick={() => { setEditingVehicle(null); setIsModalOpen(true) }} className="btn-primary">
            <PlusIcon className="w-4 h-4" />
            Добавить авто
          </button>
        )}
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-animation">
        <StatCard label="Всего" value={stats.total} tone="neutral" icon={<Car className="w-[18px] h-[18px]" />} />
        <StatCard label="Свободно" value={stats.available} tone="emerald" icon={<CheckCircle2 className="w-[18px] h-[18px]" />} />
        <StatCard label="В аренде" value={stats.rented} tone="amber" icon={<KeyRound className="w-[18px] h-[18px]" />} />
        <StatCard label="На ТО" value={stats.maintenance} tone="rose" icon={<Wrench className="w-[18px] h-[18px]" />} />
      </div>

      {/* Documents alert */}
      {expiringVehicles.length > 0 && (
        <div className="card stripe-l p-3.5 flex items-center gap-3 fade-up" style={{ ['--stripe' as string]: '#f59e0b', background: 'var(--accent-soft)', borderColor: 'var(--accent-soft-border)' }}>
          <span className="icon-soft icon-soft-amber w-10 h-10"><ShieldAlert className="w-[19px] h-[19px]" /></span>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold" style={{ color: 'var(--accent)' }}>Документы требуют внимания</p>
            <p className="text-[12px] text-[var(--ink-muted)]">У {expiringVehicles.length} авто истекает или истёк срок страховки / техосмотра</p>
          </div>
          <button
            onClick={() => setOnlyExpiring(v => !v)}
            className={clsx('text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors', onlyExpiring ? 'bg-[var(--ink)] text-[var(--surface)]' : 'btn-secondary')}
          >
            {onlyExpiring ? 'Сбросить' : 'Показать'}
          </button>
        </div>
      )}

      {/* Toolbar: search + sort + view */}
      <div className="flex flex-col lg:flex-row gap-3 fade-up">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--ink-subtle)]" />
          <input
            type="text"
            placeholder="Поиск по марке, модели или номеру…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input !pl-11"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center text-[var(--ink-subtle)]"><ArrowUpDown className="w-[18px] h-[18px]" /></span>
          <SelectDropdown
            className="w-[185px]"
            value={sortBy}
            onChange={(v) => setSortBy(v as SortKey)}
            options={Object.entries(sortLabels).map(([value, label]) => ({ value, label }))}
          />
          <div className="segment">
            <button className={clsx('segment-item !px-3', view === 'grid' && 'is-active')} onClick={() => setView('grid')} aria-label="Плитки"><LayoutGrid className="w-[16px] h-[16px]" /></button>
            <button className={clsx('segment-item !px-3', view === 'list' && 'is-active')} onClick={() => setView('list')} aria-label="Список"><List className="w-[16px] h-[16px]" /></button>
          </div>
        </div>
      </div>

      {/* Status segment + result count */}
      <div className="flex items-center justify-between gap-3 flex-wrap -mt-1">
        <div className="segment overflow-x-auto max-w-full">
          {(['all', 'available', 'rented', 'maintenance'] as const).map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={clsx('segment-item', statusFilter === status && 'is-active')}>
              {status === 'all' ? 'Все' : statusLabels[status]}
              <span className="segment-item-count">{statusCount(status)}</span>
            </button>
          ))}
        </div>
        <p className="text-[12px] text-[var(--ink-muted)]">Показано <span className="font-semibold text-[var(--ink-2)] num-roll">{displayedVehicles.length}</span></p>
      </div>

      {/* Vehicles */}
      {displayedVehicles.length === 0 ? (
        <div className="card p-12 text-center fade-up">
          <span className="icon-soft icon-soft-neutral w-16 h-16 mx-auto mb-4 breathe"><Car className="w-8 h-8" /></span>
          <p className="text-[var(--ink-2)] font-medium">
            {vehicles.length === 0 ? 'Авто пока нет' : 'Авто не найдены'}
          </p>
          <p className="text-[13px] text-[var(--ink-subtle)] mt-1">
            {vehicles.length === 0 ? 'Добавьте первый автомобиль, нажав кнопку выше' : 'Попробуйте изменить критерии поиска'}
          </p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-animation">
          {displayedVehicles.map((vehicle, index) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} canEdit={canEditVehicles} {...openVehicle(vehicle)} />
          ))}
        </div>
      ) : (
        <div className="table-container fade-up">
          <table className="table">
            <thead>
              <tr>
                <th>Авто</th>
                <th>Год</th>
                <th className="hidden md:table-cell">Топливо</th>
                <th className="hidden lg:table-cell">Пробег</th>
                <th>Статус</th>
                <th className="text-right">฿ / мес</th>
                {canEditVehicles && <th className="w-px"></th>}
              </tr>
            </thead>
            <tbody>
              {displayedVehicles.map((vehicle) => (
                <VehicleRow key={vehicle.id} vehicle={vehicle} canEdit={canEditVehicles} {...openVehicle(vehicle)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <VehicleModal
          vehicle={editingVehicle}
          onClose={() => {
            setIsModalOpen(false)
            setEditingVehicle(null)
          }}
          onSave={handleSave}
        />
      )}

      {/* Metadata Editor */}
      {metadataVehicle && (
        <VehicleMetadataEditor
          vehicle={metadataVehicle}
          onClose={() => setMetadataVehicle(null)}
          onSave={() => {
            // Optional: could refresh or show a success message
          }}
        />
      )}

      {/* View Detail Modal */}
      {viewingVehicle && (
        <VehicleDetailModal
          vehicle={viewingVehicle}
          canEdit={canEditVehicles}
          onClose={() => setViewingVehicle(null)}
          onEdit={() => {
            setEditingVehicle(viewingVehicle)
            setIsModalOpen(true)
            setViewingVehicle(null)
          }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, tone, icon }: {
  label: string; value: number; tone: 'neutral' | 'emerald' | 'amber' | 'rose'; icon: React.ReactNode
}) {
  return (
    <div className="stat-card card-hover">
      <span className={clsx('icon-soft w-9 h-9 mb-2.5', `icon-soft-${tone}`)}>{icon}</span>
      <p className="eyebrow mb-1">{label}</p>
      <p className="text-[26px] leading-none font-bold tracking-tight text-[var(--ink)]"><CountUp value={value} /></p>
    </div>
  )
}

function RateCell({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-[var(--ink-subtle)]">{label}</p>
      <p className={clsx('text-[13px] font-bold mt-0.5 num-roll', highlight ? '' : 'text-[var(--ink)]')} style={highlight ? { color: 'var(--accent)' } : undefined}>
        {value > 0 ? `฿${value.toLocaleString('ru-RU')}` : '—'}
      </p>
    </div>
  )
}

function Specs({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-[var(--ink-muted)]">
      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[var(--ink-subtle)]" />{vehicle.year}</span>
      <span className="flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5 text-[var(--ink-subtle)]" />{fuelLabels[vehicle.fuelType] || vehicle.fuelType}</span>
      {vehicle.mileage > 0 && <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-[var(--ink-subtle)]" />{vehicle.mileage.toLocaleString('ru-RU')} км</span>}
      <span className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-full border border-[var(--border-strong)]" style={{ background: getColorHex(vehicle.color) }} />
        {vehicle.color}
      </span>
    </div>
  )
}

function VehicleCard({
  vehicle, canEdit = true, onView, onEdit, onDelete, onOpenMetadata,
}: {
  vehicle: Vehicle
  index?: number
  canEdit?: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onOpenMetadata: () => void
}) {
  const warn = docWarning(vehicle)
  return (
    <div onClick={onView} className="card card-hover p-5 cursor-pointer flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="icon-soft icon-soft-neutral w-12 h-12"><Car className="w-6 h-6" /></span>
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--ink)] truncate">{vehicle.brand} {vehicle.model}</h3>
            <p className="text-[12.5px] text-[var(--ink-muted)] font-mono">{vehicle.licensePlate}</p>
          </div>
        </div>
        <span className={clsx('pill', statusPill[vehicle.status])}>{statusLabels[vehicle.status]}</span>
      </div>

      {/* Specs */}
      <div className="mb-3"><Specs vehicle={vehicle} /></div>

      {/* Doc warning */}
      {warn && (
        <div className={clsx('mb-3 inline-flex w-fit items-center gap-1.5 pill', warn.expired ? 'pill-danger' : 'pill-warning')}>
          <ShieldAlert className="w-3 h-3" />{warn.label}
        </div>
      )}

      {/* Rates */}
      {vehicle.rateMonthly > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4 mt-auto">
          <RateCell label="День" value={vehicle.rateDaily} />
          <RateCell label="7 дней" value={vehicle.rate7days} />
          <RateCell label="Месяц" value={vehicle.rateMonthly} highlight />
        </div>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="flex gap-2 pt-3 border-t border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit} className="btn-secondary flex-1 !py-2 text-[13px]">
            <SquarePen className="w-4 h-4" /> Изменить
          </button>
          <button onClick={onOpenMetadata} className="btn-icon" title="Настройки для сайта"><Globe className="w-4 h-4" /></button>
          <button onClick={onDelete} className="btn-icon hover:!text-red-600 hover:!border-red-200" title="В архив"><Trash2 className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  )
}

function VehicleRow({
  vehicle, canEdit = true, onView, onEdit, onDelete, onOpenMetadata,
}: {
  vehicle: Vehicle
  canEdit?: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onOpenMetadata: () => void
}) {
  const warn = docWarning(vehicle)
  return (
    <tr onClick={onView} className="cursor-pointer">
      <td>
        <div className="flex items-center gap-3 min-w-0">
          <span className="icon-soft icon-soft-neutral w-9 h-9"><Car className="w-[18px] h-[18px]" /></span>
          <div className="min-w-0">
            <p className="font-medium text-[var(--ink)] truncate flex items-center gap-1.5">
              {vehicle.brand} {vehicle.model}
              {warn && <ShieldAlert className={clsx('w-3.5 h-3.5 shrink-0', warn.expired ? 'text-red-500' : 'text-amber-500')} />}
            </p>
            <p className="text-[11px] font-mono text-[var(--ink-subtle)]">{vehicle.licensePlate}</p>
          </div>
        </div>
      </td>
      <td className="text-[var(--ink-muted)]">{vehicle.year}</td>
      <td className="hidden md:table-cell text-[var(--ink-muted)]">{fuelLabels[vehicle.fuelType] || vehicle.fuelType}</td>
      <td className="hidden lg:table-cell text-[var(--ink-muted)]">{vehicle.mileage > 0 ? `${vehicle.mileage.toLocaleString('ru-RU')} км` : '—'}</td>
      <td><span className={clsx('pill', statusPill[vehicle.status])}>{statusLabels[vehicle.status]}</span></td>
      <td className="text-right font-semibold text-[var(--ink)] num-roll">{vehicle.rateMonthly > 0 ? `฿${vehicle.rateMonthly.toLocaleString('ru-RU')}` : '—'}</td>
      {canEdit && (
        <td>
          <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
            <button onClick={onEdit} className="btn-icon !w-8 !h-8" title="Изменить"><SquarePen className="w-4 h-4" /></button>
            <button onClick={onOpenMetadata} className="btn-icon !w-8 !h-8" title="Настройки для сайта"><Globe className="w-4 h-4" /></button>
            <button onClick={onDelete} className="btn-icon !w-8 !h-8 hover:!text-red-600 hover:!border-red-200" title="В архив"><Trash2 className="w-4 h-4" /></button>
          </div>
        </td>
      )}
    </tr>
  )
}

function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    white: '#ffffff',
    black: '#1a1a1a',
    silver: '#c0c0c0',
    grey: '#808080',
    gray: '#808080',
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    orange: '#f97316',
    purple: '#a855f7',
    pink: '#ec4899',
    brown: '#78716c',
    chameleon: 'linear-gradient(135deg, #22c55e, #3b82f6, #a855f7)',
  }
  return colors[color.toLowerCase()] || '#9ca3af'
}

function VehicleModal({
  vehicle,
  onClose,
  onSave,
}: {
  vehicle: Vehicle | null
  onClose: () => void
  onSave: (data: VehicleFormData) => void
}) {
  const [formData, setFormData] = useState<VehicleFormData>({
    brand: vehicle?.brand ?? '',
    model: vehicle?.model ?? '',
    licensePlate: vehicle?.licensePlate ?? '',
    vin: vehicle?.vin ?? '',
    year: vehicle?.year ?? new Date().getFullYear(),
    color: vehicle?.color ?? '',
    fuelType: vehicle?.fuelType ?? 'petrol',
    mileage: vehicle?.mileage ?? 0,
    status: vehicle?.status ?? 'available',
    rateDaily: vehicle?.rateDaily ?? 0,
    rate3days: vehicle?.rate3days ?? 0,
    rate7days: vehicle?.rate7days ?? 0,
    rateMonthly: vehicle?.rateMonthly ?? 0,
    insuranceExpiry: vehicle?.insuranceExpiry ?? '',
    inspectionExpiry: vehicle?.inspectionExpiry ?? '',
    notes: vehicle?.notes ?? '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-overlay" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="modal-content relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
                <CarIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {vehicle ? 'Редактирование' : 'Новый автомобиль'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Заполните данные транспорта'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {/* Basic Info Section */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon">
                  <InfoIcon className="w-full h-full" />
                </span>
                Основная информация
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="form-label required">Марка</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="input-enhanced"
                    placeholder="Toyota"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="form-label required">Модель</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="input-enhanced"
                    placeholder="Camry"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="form-label required">Год выпуска</label>
                  <input
                    type="number"
                    required
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="input-enhanced"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="form-label required">Гос. номер</label>
                  <input
                    type="text"
                    required
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                    className="input-enhanced font-mono tracking-wider"
                    placeholder="1กข 1234"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="form-label required">Цвет</label>
                  <div className="flex gap-2">
                    <div
                      className="w-12 h-[46px] rounded-xl border-2 border-gray-200 dark:border-zinc-700 flex-shrink-0"
                      style={{ backgroundColor: getColorHex(formData.color) }}
                    />
                    <input
                      type="text"
                      required
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="input-enhanced"
                      placeholder="Белый"
                    />
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <SelectDropdown
                    label="Топливо"
                    value={formData.fuelType}
                    onChange={(value) => setFormData({ ...formData, fuelType: value as VehicleFormData['fuelType'] })}
                    options={Object.entries(fuelLabels).map(([value, label]) => ({ value, label }))}
                  />
                </div>
              </div>
            </div>

            {/* Status & Mileage */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon">
                  <GaugeIcon className="w-full h-full" />
                </span>
                Состояние
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SelectDropdown
                  label="Статус"
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value as VehicleStatus })}
                  options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
                />
                <div>
                  <label className="form-label">Пробег</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                      className="input-enhanced pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">км</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rates Section */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon">
                  <CurrencyIcon className="w-full h-full" />
                </span>
                Тарифы аренды
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">1 день</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">฿</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.rateDaily || ''}
                      onChange={(e) => setFormData({ ...formData, rateDaily: parseInt(e.target.value) || 0 })}
                      className="input-enhanced pl-8 text-center"
                      placeholder="—"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">3 дня</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">฿</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.rate3days || ''}
                      onChange={(e) => setFormData({ ...formData, rate3days: parseInt(e.target.value) || 0 })}
                      className="input-enhanced pl-8 text-center"
                      placeholder="—"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">7 дней</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">฿</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.rate7days || ''}
                      onChange={(e) => setFormData({ ...formData, rate7days: parseInt(e.target.value) || 0 })}
                      className="input-enhanced pl-8 text-center"
                      placeholder="—"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Месяц</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">฿</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.rateMonthly || ''}
                      onChange={(e) => setFormData({ ...formData, rateMonthly: parseInt(e.target.value) || 0 })}
                      className="input-enhanced pl-8 text-center"
                      placeholder="—"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dates Section */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon">
                  <CalendarIcon className="w-full h-full" />
                </span>
                Документы и даты
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Страховка до"
                  value={formData.insuranceExpiry || ''}
                  onChange={(value) => setFormData({ ...formData, insuranceExpiry: value })}
                />
                <DatePicker
                  label="Техосмотр до"
                  value={formData.inspectionExpiry || ''}
                  onChange={(value) => setFormData({ ...formData, inspectionExpiry: value })}
                />
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="form-label">Заметки</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="input-enhanced resize-none"
                placeholder="Дополнительная информация об автомобиле..."
              />
            </div>
          </form>

          {/* Footer */}
          <div className="modal-footer flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn btn-secondary py-3">
              Отмена
            </button>
            <button onClick={handleSubmit} className="flex-1 btn btn-primary py-3">
              <CheckIcon className="w-5 h-5 mr-2" />
              {vehicle ? 'Сохранить изменения' : 'Добавить авто'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function VehicleDetailModal({
  vehicle,
  canEdit = true,
  onClose,
  onEdit,
}: {
  vehicle: Vehicle
  canEdit?: boolean
  onClose: () => void
  onEdit: () => void
}) {
  const [rentals, setRentals] = useState<Rental[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchVehicleRentals()
  }, [vehicle.id])

  const fetchVehicleRentals = async () => {
    try {
      const response = await fetch('/api/rentals')
      if (response.ok) {
        const data = await response.json()
        const vehicleRentals = data.filter((r: Rental) => r.vehicle?.id === vehicle.id)
        setRentals(vehicleRentals)
      }
    } catch (error) {
      console.error('Failed to fetch rentals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const rentalStatusLabels: Record<string, string> = {
    active: 'Активна',
    completed: 'Завершена',
    cancelled: 'Отменена',
  }

  const rentalStatusColors: Record<string, string> = {
    active: 'badge-success',
    completed: 'badge-gray',
    cancelled: 'badge-danger',
  }

  const totalRentals = rentals.length
  const totalEarned = rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-overlay" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="modal-content relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <CarIcon className="w-7 h-7 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {vehicle.brand} {vehicle.model}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="font-mono">{vehicle.licensePlate}</span>
                  <span className={clsx('badge', statusColors[vehicle.status])}>
                    {statusLabels[vehicle.status]}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <EditIcon className="w-5 h-5 text-gray-500" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Год</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{vehicle.year}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Пробег</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{vehicle.mileage?.toLocaleString()} км</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Всего аренд</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalRentals}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Заработано</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(totalEarned)}</p>
              </div>
            </div>

            {/* Rates */}
            {vehicle.rateMonthly > 0 && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Тарифы</p>
                <div className="flex flex-wrap gap-4">
                  {vehicle.rateDaily > 0 && (
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 text-sm">1 день:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">฿{vehicle.rateDaily.toLocaleString()}</span>
                    </div>
                  )}
                  {vehicle.rate7days > 0 && (
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 text-sm">7 дней:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">฿{vehicle.rate7days.toLocaleString()}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400 dark:text-gray-500 text-sm">Месяц:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">฿{vehicle.rateMonthly.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rental History */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-gray-400" />
                История аренд
              </h3>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full animate-spin" />
                </div>
              ) : rentals.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                  <UserIcon className="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Нет истории аренд</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rentals.map((rental) => (
                    <div
                      key={rental.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {rental.client?.fullName || 'Неизвестный клиент'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(rental.startDate)} — {formatDate(rental.plannedEndDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(rental.totalAmount || 0)}
                        </p>
                        <span className={clsx('badge', rentalStatusColors[rental.status])}>
                          {rentalStatusLabels[rental.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            {vehicle.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Заметки</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                  {vehicle.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
            <button onClick={onClose} className="w-full btn btn-secondary py-3">
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===================== Icons (lucide) ===================== */
function HistoryIcon({ className }: { className?: string }) { return <History className={className} /> }
function UserIcon({ className }: { className?: string }) { return <User className={className} /> }
function InfoIcon({ className }: { className?: string }) { return <Info className={className} /> }
function GaugeIcon({ className }: { className?: string }) { return <Gauge className={className} /> }
function CurrencyIcon({ className }: { className?: string }) { return <Banknote className={className} /> }
function PlusIcon({ className }: { className?: string }) { return <Plus className={className} /> }
function CarIcon({ className }: { className?: string }) { return <Car className={className} /> }
function SearchIcon({ className }: { className?: string }) { return <Search className={className} /> }
function CheckIcon({ className }: { className?: string }) { return <CheckCircle2 className={className} /> }
function CalendarIcon({ className }: { className?: string }) { return <Calendar className={className} /> }
function EditIcon({ className }: { className?: string }) { return <SquarePen className={className} /> }
function CloseIcon({ className }: { className?: string }) { return <X className={className} /> }
