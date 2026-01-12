import { useState, useEffect, useRef } from 'react'
import type { Maintenance, Vehicle, MaintenanceFormData, MaintenanceType } from '@/types'
import clsx from 'clsx'
import SelectDropdown from '@/components/ui/SelectDropdown'
import DatePicker from '@/components/ui/DatePicker'

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
          'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm',
          'border border-gray-200/60 dark:border-gray-700/60',
          'hover:border-primary-300 dark:hover:border-primary-600',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
          isOpen && 'ring-2 ring-primary-500/20 border-primary-400'
        )}
      >
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center flex-shrink-0">
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
          <div className="dark:bg-gray-900/95">
            <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 border-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
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
                        ? 'bg-primary-50 dark:bg-primary-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <div className={clsx(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      option.value === value
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                    )}>
                      {option.value === value && (
                        <CheckSmallIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        'font-medium truncate',
                        option.value === value
                          ? 'text-primary-600 dark:text-primary-400'
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

export default function MaintenancePage() {
  const [records, setRecords] = useState<Maintenance[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        fetchData()
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error('Failed to save maintenance record:', error)
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

  // Stats
  const stats = {
    total: records.length,
    totalCost: records.reduce((sum, r) => sum + r.cost, 0),
    thisMonth: records.filter(r => {
      const date = new Date(r.date)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 dark:border-primary-900" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Обслуживание</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Записи о техобслуживании и ремонте
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Добавить запись
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '0ms' }}>
          <span className="text-gray-400 dark:text-gray-500 mb-2">
            <WrenchIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.total}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">Всего записей</p>
        </div>
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '50ms' }}>
          <span className="text-gray-400 dark:text-gray-500 mb-2">
            <CurrencyIcon className="w-5 h-5" />
          </span>
          <p className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">{formatCurrency(stats.totalCost)}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">Всего расходов</p>
        </div>
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
          <span className="text-gray-400 dark:text-gray-500 mb-2">
            <CalendarIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.thisMonth}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">В этом месяце</p>
        </div>
      </div>

      {/* Filter */}
      <div className="animate-slide-up w-full sm:w-72" style={{ animationDelay: '150ms' }}>
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
        <div className="p-12 text-center animate-slide-up rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm" style={{ animationDelay: '200ms' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
            <WrenchIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Записей пока нет
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Добавьте первую запись о техобслуживании
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record, index) => (
            <div
              key={record.id}
              className="p-5 animate-slide-up rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm"
              style={{ animationDelay: `${200 + index * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Left side - info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 dark:bg-zinc-800">
                    {record.type === 'scheduled' && <GearIcon className="w-6 h-6 text-gray-400" />}
                    {record.type === 'repair' && <WrenchIcon className="w-6 h-6 text-gray-400" />}
                    {record.type === 'tire' && <TireIcon className="w-6 h-6 text-gray-400" />}
                    {record.type === 'wash' && <WashIcon className="w-6 h-6 text-gray-400" />}
                    {record.type === 'other' && <DotsIcon className="w-6 h-6 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('badge', typeColors[record.type])}>
                        {typeLabels[record.type]}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(record.date)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {record.vehicle?.brand} {record.vehicle?.model}
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        {record.vehicle?.licensePlate}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {record.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <LocationIcon className="w-3.5 h-3.5" />
                        {record.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <SpeedometerIcon className="w-3.5 h-3.5" />
                        {record.mileage.toLocaleString()} км
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side - cost */}
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(record.cost)}
                    </p>
                  </div>
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
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function MaintenanceModal({
  vehicles,
  onClose,
  onSave,
}: {
  vehicles: Vehicle[]
  onClose: () => void
  onSave: (data: MaintenanceFormData) => void
}) {
  const [formData, setFormData] = useState<MaintenanceFormData>({
    vehicleId: vehicles[0]?.id ?? 0,
    type: 'scheduled',
    date: new Date().toISOString().split('T')[0],
    mileage: vehicles[0]?.mileage ?? 0,
    cost: 0,
    location: '',
    description: '',
  })

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId)

  useEffect(() => {
    const vehicle = vehicles.find(v => v.id === formData.vehicleId)
    if (vehicle) {
      setFormData(prev => ({ ...prev, mileage: vehicle.mileage }))
    }
  }, [formData.vehicleId, vehicles])

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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Новая запись ТО</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Добавление записи о техобслуживании</p>
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
                  <div className="mt-2 flex items-center gap-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <div className="text-xs text-blue-600 dark:text-blue-400">
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
            <button type="button" onClick={onClose} className="flex-1 btn btn-secondary py-3">
              Отмена
            </button>
            <button onClick={handleSubmit} className="flex-1 btn btn-primary py-3">
              <CheckIcon className="w-5 h-5 mr-2" />
              Добавить запись
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function TireIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  )
}

function WashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l.8 4.2m-.8-4.2l-4.2.8M5 14.5l-.8 4.2m.8-4.2l4.2.8m5.8-1.8v1.5m0 0V18m0-3v-1.5m0 4.5H12m0 0h3m-3 0v-1.5" />
    </svg>
  )
}

function DotsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  )
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

function SpeedometerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function CheckSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
