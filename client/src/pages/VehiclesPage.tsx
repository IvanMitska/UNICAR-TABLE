import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Vehicle, VehicleStatus, VehicleFormData } from '@/types'
import clsx from 'clsx'
import SelectDropdown from '@/components/ui/SelectDropdown'
import DatePicker from '@/components/ui/DatePicker'
import VehicleMetadataEditor from '@/components/vehicles/VehicleMetadataEditor'

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
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [metadataVehicle, setMetadataVehicle] = useState<Vehicle | null>(null)

  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error)
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
        fetchVehicles()
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
        fetchVehicles()
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

    return matchesSearch && matchesStatus
  })

  // Stats
  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    rented: vehicles.filter(v => v.status === 'rented').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-10 h-10 text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Автомобили</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Управление автопарком: {stats.total} авто
          </p>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null)
            setIsModalOpen(true)
          }}
          className="flex items-center px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Добавить авто
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '0ms' }}>
          <span className="text-gray-600 dark:text-gray-400 mb-2">
            <CarIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.total}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500 mt-1">Всего</p>
        </div>
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '50ms' }}>
          <span className="text-gray-600 dark:text-gray-400 mb-2">
            <CheckIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.available}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500 mt-1">Свободно</p>
        </div>
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
          <span className="text-gray-600 dark:text-gray-400 mb-2">
            <KeyIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.rented}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500 mt-1">В аренде</p>
        </div>
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '150ms' }}>
          <span className="text-gray-600 dark:text-gray-400 mb-2">
            <WrenchIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.maintenance}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500 mt-1">На ТО</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по марке, модели или номеру..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-enhanced pl-12"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'available', 'rented', 'maintenance'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={clsx(
                'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                statusFilter === status
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800'
              )}
            >
              {status === 'all' ? 'Все' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles grid */}
      {filteredVehicles.length === 0 ? (
        <div className="p-12 text-center animate-slide-up rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm" style={{ animationDelay: '250ms' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
            <CarIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {vehicles.length === 0 ? 'Авто пока нет' : 'Авто не найдены'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {vehicles.length === 0 ? 'Добавьте первый автомобиль, нажав кнопку выше' : 'Попробуйте изменить критерии поиска'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle, index) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              index={index}
              onEdit={() => {
                setEditingVehicle(vehicle)
                setIsModalOpen(true)
              }}
              onDelete={() => handleDelete(vehicle.id)}
              onOpenMetadata={() => setMetadataVehicle(vehicle)}
            />
          ))}
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
    </div>
  )
}

function VehicleCard({
  vehicle,
  index,
  onEdit,
  onDelete,
  onOpenMetadata,
}: {
  vehicle: Vehicle
  index: number
  onEdit: () => void
  onDelete: () => void
  onOpenMetadata: () => void
}) {
  return (
    <div
      className="p-5 animate-slide-up rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
            <CarIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {vehicle.licensePlate}
            </p>
          </div>
        </div>
        <span className={clsx('badge', statusColors[vehicle.status])}>
          {statusLabels[vehicle.status]}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">{vehicle.year}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border-2 border-gray-200 dark:border-zinc-700"
            style={{ backgroundColor: getColorHex(vehicle.color) }}
          />
          <span className="text-gray-600 dark:text-gray-400">{vehicle.color}</span>
        </div>
      </div>

      {/* Prices */}
      {vehicle.rateMonthly > 0 && (
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 mb-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {vehicle.rateDaily > 0 && (
              <div>
                <span className="text-gray-400 dark:text-gray-500">1 день</span>
                <span className="ml-1 font-semibold text-gray-900 dark:text-white">฿{vehicle.rateDaily.toLocaleString()}</span>
              </div>
            )}
            {vehicle.rate7days > 0 && (
              <div>
                <span className="text-gray-400 dark:text-gray-500">7 дней</span>
                <span className="ml-1 font-semibold text-gray-900 dark:text-white">฿{vehicle.rate7days.toLocaleString()}</span>
              </div>
            )}
            <div>
              <span className="text-gray-400 dark:text-gray-500">Месяц</span>
              <span className="ml-1 font-semibold text-gray-900 dark:text-white">฿{vehicle.rateMonthly.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
        <button
          onClick={onEdit}
          className="flex-1 btn btn-secondary text-sm py-2"
        >
          <EditIcon className="w-4 h-4 mr-1.5" />
          Изменить
        </button>
        <button
          onClick={onOpenMetadata}
          className="btn btn-ghost text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-3"
          title="Настройки для сайта"
        >
          <GlobeIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="btn btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
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
                      className="w-12 h-[46px] rounded-xl border-2 border-gray-200 dark:border-gray-700 flex-shrink-0"
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

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function GaugeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  )
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
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

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  )
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  )
}
