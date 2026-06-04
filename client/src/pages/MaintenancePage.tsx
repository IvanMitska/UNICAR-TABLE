import { useState, useEffect, useRef } from 'react'
import type { Maintenance, Vehicle, MaintenanceFormData, MaintenanceType } from '@/types'
import clsx from 'clsx'
import SelectDropdown from '@/components/ui/SelectDropdown'
import DatePicker from '@/components/ui/DatePicker'
import { CountUp } from '@/components/ui/CountUp'
import {
  Plus, Wrench, X, Car, Calendar, Banknote, Check, Settings, Disc,
  Droplets, MoreHorizontal, MapPin, Gauge, ChevronDown, Search, Trash2,
} from 'lucide-react'

// Custom Select Component
interface SelectOption {
  value: number
  label: string
  sublabel?: string
}

function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  searchPlaceholder = 'Поиск...',
  icon,
}: {
  options: SelectOption[]
  value: number
  onChange: (value: number) => void
  placeholder?: string
  searchPlaceholder?: string
  icon?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(o => o.value === value)

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    option.sublabel?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
          'bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm',
          'border border-gray-200/60 dark:border-zinc-700/60',
          'hover:border-gray-400 dark:hover:border-zinc-500',
          'focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-zinc-700 focus:border-gray-400',
          isOpen && 'ring-2 ring-gray-200 dark:ring-zinc-700 border-gray-400 dark:border-zinc-500'
        )}
      >
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {selectedOption ? (
            <>
              <p className="font-medium text-gray-900 dark:text-white truncate">{selectedOption.label}</p>
              {selectedOption.sublabel && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selectedOption.sublabel}</p>
              )}
            </>
          ) : (
            <p className="text-gray-400">{placeholder}</p>
          )}
        </div>
        <ChevronDownIcon className={clsx('w-5 h-5 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-2xl overflow-hidden shadow-2xl shadow-black/20"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <div className="dark:bg-zinc-900/95">
            <div className="p-3 border-b border-gray-200/50 dark:border-zinc-700/50">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-100/80 dark:bg-zinc-800/80 border-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-600"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto scrollbar-thin py-2">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400">
                  <p className="text-sm">Ничего не найдено</p>
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150',
                      option.value === value
                        ? 'bg-gray-100 dark:bg-zinc-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <div className={clsx(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      option.value === value
                        ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white'
                        : 'border-gray-300 dark:border-zinc-600'
                    )}>
                      {option.value === value && (
                        <CheckSmallIcon className="w-3 h-3 text-white dark:text-gray-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        'font-medium truncate',
                        option.value === value
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-900 dark:text-white'
                      )}>
                        {option.label}
                      </p>
                      {option.sublabel && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{option.sublabel}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const typeLabels: Record<MaintenanceType, string> = {
  scheduled: 'Плановое ТО',
  repair: 'Ремонт',
  tire: 'Шиномонтаж',
  wash: 'Мойка',
  other: 'Прочее',
}

const typeColors: Record<MaintenanceType, string> = {
  scheduled: 'badge-info',
  repair: 'badge-danger',
  tire: 'badge-warning',
  wash: 'badge-success',
  other: 'badge-gray',
}

function MaintStat({ label, value, format, tone, icon }: {
  label: string; value: number; format?: (n: number) => string; tone: 'neutral' | 'amber' | 'rose'; icon: React.ReactNode
}) {
  return (
    <div className="stat-card card-hover">
      <span className={clsx('icon-soft w-9 h-9 mb-2.5', `icon-soft-${tone}`)}>{icon}</span>
      <p className="eyebrow mb-1">{label}</p>
      <p className="text-[22px] sm:text-[24px] leading-none font-bold tracking-tight text-[var(--ink)]"><CountUp value={value} format={format} /></p>
    </div>
  )
}

export default function MaintenancePage() {
  const [records, setRecords] = useState<Maintenance[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null)
  const [vehicleFilter, setVehicleFilter] = useState<number | 'all'>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [maintenanceRes, vehiclesRes] = await Promise.all([
        fetch('/api/maintenance'),
        fetch('/api/vehicles'),
      ])

      if (maintenanceRes.ok) setRecords(await maintenanceRes.json())
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (data: MaintenanceFormData) => {
    try {
      const url = editingMaintenance
        ? `/api/maintenance/${editingMaintenance.id}`
        : '/api/maintenance'
      const method = editingMaintenance ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        fetchData()
        setIsModalOpen(false)
        setEditingMaintenance(null)
      }
    } catch (error) {
      console.error('Failed to save maintenance record:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return

    try {
      const response = await fetch(`/api/maintenance/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData()
        setIsModalOpen(false)
        setEditingMaintenance(null)
      }
    } catch (error) {
      console.error('Failed to delete maintenance record:', error)
    }
  }

  const handleCardClick = (record: Maintenance) => {
    setEditingMaintenance(record)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingMaintenance(null)
  }

  const handleUpdateVehicleStatus = async (vehicleId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to update vehicle status:', error)
    }
  }

  const filteredRecords = records.filter((record) =>
    vehicleFilter === 'all' || record.vehicleId === vehicleFilter
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Vehicles currently in maintenance
  const vehiclesInMaintenance = vehicles.filter(v => v.status === 'maintenance')

  // Stats
  const stats = {
    total: records.length,
    totalCost: records.reduce((sum, r) => sum + r.cost, 0),
    thisMonth: records.filter(r => {
      const date = new Date(r.date)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length,
    inMaintenance: vehiclesInMaintenance.length,
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[112px] rounded-[18px] skeleton" />)}
        </div>
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-[90px] rounded-2xl skeleton" />)}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 fade-up">
        <div>
          <p className="eyebrow mb-1.5">Техника</p>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[var(--ink)] leading-none">Обслуживание</h1>
        </div>
        <button onClick={() => { setEditingMaintenance(null); setIsModalOpen(true) }} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Добавить запись
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-animation">
        <MaintStat label="Всего записей" value={stats.total} tone="neutral" icon={<WrenchIcon className="w-[18px] h-[18px]" />} />
        <MaintStat label="Всего расходов" value={stats.totalCost} format={formatCurrency} tone="amber" icon={<CurrencyIcon className="w-[18px] h-[18px]" />} />
        <MaintStat label="В этом месяце" value={stats.thisMonth} tone="neutral" icon={<CalendarIcon className="w-[18px] h-[18px]" />} />
        <MaintStat label="Сейчас на ТО" value={stats.inMaintenance} tone="rose" icon={<ToolIcon className="w-[18px] h-[18px]" />} />
      </div>

      {/* Vehicles in maintenance section */}
      {vehiclesInMaintenance.length > 0 && (
        <div className="fade-up">
          <h2 className="text-[14px] font-semibold text-[var(--ink-2)] mb-3 flex items-center gap-2.5">
            <span className="icon-soft icon-soft-amber w-8 h-8"><ToolIcon className="w-[17px] h-[17px]" /></span>
            Машины на ТО
            <span className="pill pill-warning">{vehiclesInMaintenance.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-animation">
            {vehiclesInMaintenance.map((vehicle) => (
              <div key={vehicle.id} className="card card-hover stripe-l p-4" style={{ ['--stripe' as string]: '#f59e0b' }}>
                <div className="flex items-center gap-3">
                  <span className="icon-soft icon-soft-amber w-11 h-11"><CarIcon className="w-[22px] h-[22px]" /></span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--ink)] truncate">{vehicle.brand} {vehicle.model}</h3>
                    <p className="text-[12.5px] font-mono text-[var(--ink-subtle)]">{vehicle.licensePlate}</p>
                  </div>
                  <span className="pill pill-warning">На ТО</span>
                </div>
                {vehicle.notes && <p className="mt-3 text-[13px] text-[var(--ink-muted)] line-clamp-2">{vehicle.notes}</p>}
                <button onClick={() => handleUpdateVehicleStatus(vehicle.id, 'available')} className="btn-secondary w-full !py-2 mt-3 text-[13px]">
                  <CheckIcon className="w-4 h-4" /> Снять с ТО
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="fade-up w-full sm:w-72">
        <SelectDropdown
          value={vehicleFilter === 'all' ? 'all' : vehicleFilter.toString()}
          onChange={(value) => setVehicleFilter(value === 'all' ? 'all' : parseInt(value))}
          options={[
            { value: 'all', label: 'Все автомобили' },
            ...vehicles.map((vehicle) => ({
              value: vehicle.id.toString(),
              label: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`
            }))
          ]}
          placeholder="Выберите автомобиль"
        />
      </div>

      {/* Records list */}
      {filteredRecords.length === 0 ? (
        <div className="card p-12 text-center fade-up">
          <span className="icon-soft icon-soft-neutral w-16 h-16 mx-auto mb-4 breathe"><WrenchIcon className="w-8 h-8" /></span>
          <p className="text-[var(--ink-2)] font-medium">Записей пока нет</p>
          <p className="text-[13px] text-[var(--ink-subtle)] mt-1">Добавьте первую запись о техобслуживании</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-animation">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              onClick={() => handleCardClick(record)}
              className="card card-hover p-5 cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Left side - info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="icon-soft icon-soft-neutral w-12 h-12">
                    {record.type === 'scheduled' && <GearIcon className="w-6 h-6" />}
                    {record.type === 'repair' && <WrenchIcon className="w-6 h-6" />}
                    {record.type === 'tire' && <TireIcon className="w-6 h-6" />}
                    {record.type === 'wash' && <WashIcon className="w-6 h-6" />}
                    {record.type === 'other' && <DotsIcon className="w-6 h-6" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('badge', typeColors[record.type])}>{typeLabels[record.type]}</span>
                      <span className="text-[11.5px] text-[var(--ink-subtle)]">{formatDate(record.date)}</span>
                    </div>
                    <h3 className="font-semibold text-[var(--ink)]">
                      {record.vehicle?.brand} {record.vehicle?.model}
                      <span className="text-[13px] font-mono font-normal text-[var(--ink-subtle)] ml-2">{record.vehicle?.licensePlate}</span>
                    </h3>
                    <p className="text-[13px] text-[var(--ink-muted)] mt-1 line-clamp-2">{record.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[11.5px] text-[var(--ink-subtle)]">
                      <span className="flex items-center gap-1"><LocationIcon className="w-3.5 h-3.5" />{record.location}</span>
                      <span className="flex items-center gap-1"><SpeedometerIcon className="w-3.5 h-3.5" />{record.mileage.toLocaleString('ru-RU')} км</span>
                    </div>
                  </div>
                </div>

                {/* Right side - cost */}
                <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 self-start sm:self-center">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--ink-subtle)]">Стоимость</p>
                  <p className="text-[17px] font-bold text-[var(--ink)] num-roll">{formatCurrency(record.cost)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <MaintenanceModal
          vehicles={vehicles}
          maintenance={editingMaintenance}
          onClose={handleCloseModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

function MaintenanceModal({
  vehicles,
  maintenance,
  onClose,
  onSave,
  onDelete,
}: {
  vehicles: Vehicle[]
  maintenance: Maintenance | null
  onClose: () => void
  onSave: (data: MaintenanceFormData) => void
  onDelete: (id: number) => void
}) {
  const isEditing = maintenance !== null

  const [formData, setFormData] = useState<MaintenanceFormData>(() => {
    if (maintenance) {
      return {
        vehicleId: maintenance.vehicleId,
        type: maintenance.type,
        date: maintenance.date.split('T')[0],
        mileage: maintenance.mileage,
        cost: maintenance.cost,
        location: maintenance.location,
        description: maintenance.description,
      }
    }
    return {
      vehicleId: vehicles[0]?.id ?? 0,
      type: 'scheduled',
      date: new Date().toISOString().split('T')[0],
      mileage: vehicles[0]?.mileage ?? 0,
      cost: 0,
      location: '',
      description: '',
    }
  })

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId)

  useEffect(() => {
    if (!isEditing) {
      const vehicle = vehicles.find(v => v.id === formData.vehicleId)
      if (vehicle) {
        setFormData(prev => ({ ...prev, mileage: vehicle.mileage }))
      }
    }
  }, [formData.vehicleId, vehicles, isEditing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-overlay" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="modal-content relative z-10 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
                <WrenchIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isEditing ? 'Редактирование записи' : 'Новая запись ТО'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isEditing ? 'Изменение записи о техобслуживании' : 'Добавление записи о техобслуживании'}
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
            {/* Vehicle Selection */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500">
                  <CarIcon className="w-full h-full" />
                </span>
                Автомобиль
              </div>
              <div>
                <label className="form-label required">Выберите авто</label>
                <CustomSelect
                  options={vehicles.map(v => ({
                    value: v.id,
                    label: `${v.brand} ${v.model}`,
                    sublabel: v.licensePlate,
                  }))}
                  value={formData.vehicleId}
                  onChange={(value) => setFormData({ ...formData, vehicleId: value })}
                  placeholder="Выберите автомобиль"
                  searchPlaceholder="Поиск по марке или номеру..."
                  icon={<CarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                />
                {selectedVehicle && (
                  <div className="mt-2 flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Пробег:</span> {selectedVehicle.mileage?.toLocaleString()} км
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Type & Date */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500">
                  <CalendarIcon className="w-full h-full" />
                </span>
                Тип и дата
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SelectDropdown
                  label="Тип работ"
                  required
                  value={formData.type}
                  onChange={(value) => setFormData({ ...formData, type: value as MaintenanceType })}
                  options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))}
                />
                <DatePicker
                  label="Дата"
                  value={formData.date}
                  onChange={(value) => setFormData({ ...formData, date: value })}
                />
              </div>
            </div>

            {/* Mileage & Cost */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500">
                  <CurrencyIcon className="w-full h-full" />
                </span>
                Пробег и стоимость
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label required">Пробег</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                      className="input-enhanced pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">км</span>
                  </div>
                </div>
                <div>
                  <label className="form-label required">Стоимость</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">฿</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                      className="input-enhanced pl-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="form-label required">Место обслуживания</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input-enhanced"
                placeholder="Название сервисного центра"
              />
            </div>

            {/* Description */}
            <div>
              <label className="form-label required">Описание работ</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="input-enhanced resize-none"
                placeholder="Опишите выполненные работы..."
              />
            </div>
          </form>

          {/* Footer */}
          <div className="modal-footer flex gap-3">
            {isEditing && maintenance && (
              <button
                type="button"
                onClick={() => onDelete(maintenance.id)}
                className="btn py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}
            <button type="button" onClick={onClose} className="flex-1 btn btn-secondary py-3">
              Отмена
            </button>
            <button onClick={handleSubmit} className="flex-1 btn btn-primary py-3">
              <CheckIcon className="w-5 h-5 mr-2" />
              {isEditing ? 'Сохранить' : 'Добавить запись'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===================== Icons (lucide) ===================== */
function PlusIcon({ className }: { className?: string }) { return <Plus className={className} /> }
function WrenchIcon({ className }: { className?: string }) { return <Wrench className={className} /> }
function CloseIcon({ className }: { className?: string }) { return <X className={className} /> }
function CarIcon({ className }: { className?: string }) { return <Car className={className} /> }
function CalendarIcon({ className }: { className?: string }) { return <Calendar className={className} /> }
function CurrencyIcon({ className }: { className?: string }) { return <Banknote className={className} /> }
function CheckIcon({ className }: { className?: string }) { return <Check className={className} /> }
function GearIcon({ className }: { className?: string }) { return <Settings className={className} /> }
function TireIcon({ className }: { className?: string }) { return <Disc className={className} /> }
function WashIcon({ className }: { className?: string }) { return <Droplets className={className} /> }
function DotsIcon({ className }: { className?: string }) { return <MoreHorizontal className={className} /> }
function LocationIcon({ className }: { className?: string }) { return <MapPin className={className} /> }
function SpeedometerIcon({ className }: { className?: string }) { return <Gauge className={className} /> }
function ChevronDownIcon({ className }: { className?: string }) { return <ChevronDown className={className} /> }
function SearchIcon({ className }: { className?: string }) { return <Search className={className} /> }
function CheckSmallIcon({ className }: { className?: string }) { return <Check className={className} /> }
function ToolIcon({ className }: { className?: string }) { return <Wrench className={className} /> }
function TrashIcon({ className }: { className?: string }) { return <Trash2 className={className} /> }
