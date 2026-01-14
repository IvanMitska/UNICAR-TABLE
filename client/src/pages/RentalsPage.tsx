import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Rental, Vehicle, Client, RentalStatus, RentalFormData, RateType, PaymentMethod } from '@/types'
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
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl text-left transition-all duration-200',
          'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm',
          'border border-gray-200/60 dark:border-gray-700/60',
          'hover:border-primary-300 dark:hover:border-primary-600',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
          isOpen && 'ring-2 ring-primary-500/20 border-primary-400'
        )}
      >
        {icon && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {selectedOption ? (
            <>
              <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">{selectedOption.label}</p>
              {selectedOption.sublabel && (
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{selectedOption.sublabel}</p>
              )}
            </>
          ) : (
            <p className="text-sm sm:text-base text-gray-400">{placeholder}</p>
          )}
        </div>
        <ChevronIcon className={clsx('w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-2xl overflow-hidden shadow-2xl shadow-black/20 animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <div className="dark:bg-gray-900/95">
            {/* Search */}
            <div className="p-2.5 sm:p-3 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 border-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-56 sm:max-h-64 overflow-y-auto scrollbar-thin py-1.5 sm:py-2">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-6 sm:py-8 text-center text-gray-400">
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
                      'w-full flex items-center gap-2.5 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 text-left transition-all duration-150',
                      option.value === value
                        ? 'bg-primary-50 dark:bg-primary-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <div className={clsx(
                      'w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      option.value === value
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                    )}>
                      {option.value === value && (
                        <CheckSmallIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        'text-sm sm:text-base font-medium truncate',
                        option.value === value
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-900 dark:text-white'
                      )}>
                        {option.label}
                      </p>
                      {option.sublabel && (
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{option.sublabel}</p>
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

const statusLabels: Record<RentalStatus, string> = {
  active: 'Активна',
  completed: 'Завершена',
  cancelled: 'Отменена',
}

const statusColors: Record<RentalStatus, string> = {
  active: 'badge-success',
  completed: 'badge-info',
  cancelled: 'badge-danger',
}

const rateLabels: Record<RateType, string> = {
  hourly: 'Час',
  daily: 'День',
  monthly: 'Месяц',
}

const paymentLabels: Record<PaymentMethod, string> = {
  cash: 'Наличные',
  card: 'Карта',
  transfer: 'Перевод',
}

export default function RentalsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<RentalStatus | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRental, setEditingRental] = useState<Rental | null>(null)

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
      const [rentalsRes, vehiclesRes, clientsRes] = await Promise.all([
        fetch('/api/rentals'),
        fetch('/api/vehicles'),
        fetch('/api/clients'),
      ])

      if (rentalsRes.ok) setRentals(await rentalsRes.json())
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json())
      if (clientsRes.ok) setClients(await clientsRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (data: RentalFormData) => {
    try {
      const url = editingRental
        ? `/api/rentals/${editingRental.id}`
        : '/api/rentals'
      const method = editingRental ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        fetchData()
        setIsModalOpen(false)
        setEditingRental(null)
      }
    } catch (error) {
      console.error('Failed to save rental:', error)
    }
  }

  const handleComplete = async (rental: Rental) => {
    const mileageEnd = prompt('Введите пробег при возврате:', rental.mileageStart.toString())
    if (!mileageEnd) return

    try {
      const response = await fetch(`/api/rentals/${rental.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mileageEnd: parseInt(mileageEnd),
          actualEndDate: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to complete rental:', error)
    }
  }

  const filteredRentals = rentals.filter((rental) =>
    statusFilter === 'all' || rental.status === statusFilter
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(amount)
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

  // Stats
  const stats = {
    total: rentals.length,
    active: rentals.filter(r => r.status === 'active').length,
    completed: rentals.filter(r => r.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Аренды</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Управление арендами: {stats.active} активных из {stats.total}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRental(null)
            setIsModalOpen(true)
          }}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Новая аренда
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '0ms' }}>
          <span className="text-gray-400 dark:text-gray-500 mb-2">
            <KeyIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.active}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">Активных</p>
        </div>
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '50ms' }}>
          <span className="text-gray-400 dark:text-gray-500 mb-2">
            <CheckCircleIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.completed}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">Завершено</p>
        </div>
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
          <span className="text-gray-400 dark:text-gray-500 mb-2">
            <ClipboardIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.total}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">Всего</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'completed', 'cancelled'] as const).map((status) => (
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

      {/* Rentals list */}
      {filteredRentals.length === 0 ? (
        <div className="p-12 text-center animate-slide-up rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
            <ClipboardIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {rentals.length === 0 ? 'Аренд пока нет' : 'Аренды не найдены'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Создайте первую аренду, нажав кнопку выше
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRentals.map((rental, index) => (
            <div
              key={rental.id}
              className="p-5 animate-slide-up rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={clsx('badge', statusColors[rental.status])}>
                      {statusLabels[rental.status]}
                    </span>
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      #{rental.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
                      <CarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {rental.vehicle?.brand} {rental.vehicle?.model}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {rental.vehicle?.licensePlate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{rental.client?.fullName}</span>
                  </div>
                </div>

                <div className="flex flex-wrap lg:flex-nowrap gap-3 text-sm">
                  <div className="flex-1 min-w-[100px] p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Начало</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                      {formatDate(rental.startDate)}
                    </p>
                  </div>
                  <div className="flex-1 min-w-[100px] p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Конец</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                      {formatDate(rental.plannedEndDate)}
                    </p>
                  </div>
                  <div className="flex-1 min-w-[120px] p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Тариф</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5 whitespace-nowrap">
                      {formatCurrency(rental.rateAmount)}<span className="text-xs text-gray-400">/{rateLabels[rental.rateType].toLowerCase()}</span>
                    </p>
                  </div>
                  <div className="flex-1 min-w-[100px] p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Итого</span>
                    <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                      {formatCurrency(rental.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 lg:flex-col">
                  {rental.status === 'active' && (
                    <button
                      onClick={() => handleComplete(rental)}
                      className="flex-1 lg:flex-none btn btn-primary text-sm py-2"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                      Завершить
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingRental(rental)
                      setIsModalOpen(true)
                    }}
                    className="flex-1 lg:flex-none btn btn-secondary text-sm py-2"
                  >
                    <EditIcon className="w-4 h-4 mr-1.5" />
                    Изменить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <RentalModal
          rental={editingRental}
          vehicles={vehicles.filter(v => v.status === 'available' || v.id === editingRental?.vehicleId)}
          clients={clients.filter(c => c.status === 'active')}
          onClose={() => {
            setIsModalOpen(false)
            setEditingRental(null)
          }}
          onSave={handleSave}
          onClientCreated={(newClient) => {
            setClients(prev => [...prev, newClient])
          }}
        />
      )}
    </div>
  )
}

function RentalModal({
  rental,
  vehicles,
  clients: initialClients,
  onClose,
  onSave,
  onClientCreated,
}: {
  rental: Rental | null
  vehicles: Vehicle[]
  clients: Client[]
  onClose: () => void
  onSave: (data: RentalFormData) => void
  onClientCreated: (client: Client) => void
}) {
  const [clients, setClients] = useState(initialClients)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [newClientData, setNewClientData] = useState({
    fullName: '',
    phone: '',
    passport: '',
    licenseNumber: '',
    licenseExpiry: '',
    birthDate: '',
    address: '',
  })

  const [formData, setFormData] = useState<RentalFormData>({
    vehicleId: rental?.vehicleId ?? (vehicles[0]?.id ?? 0),
    clientId: rental?.clientId ?? (initialClients[0]?.id ?? 0),
    startDate: rental?.startDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    plannedEndDate: rental?.plannedEndDate?.split('T')[0] ?? '',
    mileageStart: rental?.mileageStart ?? (vehicles[0]?.mileage ?? 0),
    fuelLevelStart: rental?.fuelLevelStart ?? 100,
    rateType: rental?.rateType ?? 'daily',
    rateAmount: rental?.rateAmount ?? 2500,
    deposit: rental?.deposit ?? 10000,
    paymentMethod: rental?.paymentMethod ?? 'cash',
    extras: rental?.extras ?? '',
    conditionStart: rental?.conditionStart ?? '',
    notes: rental?.notes ?? '',
  })

  useEffect(() => {
    const vehicle = vehicles.find(v => v.id === formData.vehicleId)
    if (vehicle && !rental) {
      setFormData(prev => ({ ...prev, mileageStart: vehicle.mileage }))
    }
  }, [formData.vehicleId, vehicles, rental])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleCreateClient = async () => {
    if (!newClientData.fullName || !newClientData.phone) return

    setIsCreatingClient(true)
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newClientData,
          status: 'active',
        }),
      })

      if (response.ok) {
        const newClient = await response.json()
        setClients(prev => [...prev, newClient])
        onClientCreated(newClient)
        setFormData(prev => ({ ...prev, clientId: newClient.id }))
        setShowNewClientForm(false)
        setNewClientData({
          fullName: '',
          phone: '',
          passport: '',
          licenseNumber: '',
          licenseExpiry: '',
          birthDate: '',
          address: '',
        })
      }
    } catch (error) {
      console.error('Failed to create client:', error)
    } finally {
      setIsCreatingClient(false)
    }
  }

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId)
  const selectedClient = clients.find(c => c.id === formData.clientId)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-overlay" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="modal-content relative z-10 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <KeyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {rental ? 'Редактирование' : 'Новая аренда'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {rental ? `Аренда #${rental.id}` : 'Оформление договора аренды'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
            >
              <CloseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin">
            {/* Vehicle & Client Selection */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500">
                  <CarIcon className="w-full h-full" />
                </span>
                Автомобиль и клиент
              </div>
              <div className="space-y-4">
                <div>
                  <label className="form-label required">Автомобиль</label>
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
                    <div className="mt-3 p-3 sm:p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
                      <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-4">
                        <div className="flex flex-col sm:flex-row items-center sm:gap-2.5 text-center sm:text-left">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 flex items-center justify-center mb-1 sm:mb-0">
                            <CurrencyBahtIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">Тариф</p>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">฿{selectedVehicle.rateMonthly?.toLocaleString() || '—'}</p>
                          </div>
                        </div>
                        <div className="hidden sm:block w-px h-10 bg-gray-200 dark:bg-zinc-700" />
                        <div className="flex flex-col sm:flex-row items-center sm:gap-2.5 text-center sm:text-left">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 flex items-center justify-center mb-1 sm:mb-0">
                            <SpeedometerIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">Пробег</p>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{selectedVehicle.mileage?.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="hidden sm:block w-px h-10 bg-gray-200 dark:bg-zinc-700" />
                        <div className="flex flex-col sm:flex-row items-center sm:gap-2.5 text-center sm:text-left">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 flex items-center justify-center mb-1 sm:mb-0">
                            <FuelIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">Топливо</p>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{formData.fuelLevelStart}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label required mb-0">Клиент</label>
                    <button
                      type="button"
                      onClick={() => setShowNewClientForm(!showNewClientForm)}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                        showNewClientForm
                          ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300'
                          : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      )}
                    >
                      {showNewClientForm ? (
                        <>
                          <CloseIcon className="w-3.5 h-3.5" />
                          Отмена
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="w-3.5 h-3.5" />
                          Новый клиент
                        </>
                      )}
                    </button>
                  </div>

                  {showNewClientForm ? (
                    <div className="p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 border-b border-gray-200 dark:border-zinc-700">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                          <UserPlusIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">Быстрое добавление</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Заполните основные данные</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        <div className="sm:col-span-2">
                          <label className="form-label required text-[10px] sm:text-xs">ФИО</label>
                          <input
                            type="text"
                            required
                            value={newClientData.fullName}
                            onChange={(e) => setNewClientData({ ...newClientData, fullName: e.target.value })}
                            className="input-enhanced py-2 sm:py-2.5 text-sm"
                            placeholder="Иванов Иван Иванович"
                          />
                        </div>
                        <div>
                          <label className="form-label required text-[10px] sm:text-xs">Телефон</label>
                          <input
                            type="tel"
                            required
                            value={newClientData.phone}
                            onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                            className="input-enhanced py-2 sm:py-2.5 text-sm"
                            placeholder="+7 999 123-45-67"
                          />
                        </div>
                        <div>
                          <label className="form-label required text-[10px] sm:text-xs">Паспорт</label>
                          <input
                            type="text"
                            required
                            value={newClientData.passport}
                            onChange={(e) => setNewClientData({ ...newClientData, passport: e.target.value })}
                            className="input-enhanced py-2 sm:py-2.5 text-sm"
                            placeholder="1234 567890"
                          />
                        </div>
                        <div>
                          <label className="form-label required text-[10px] sm:text-xs">Номер ВУ</label>
                          <input
                            type="text"
                            required
                            value={newClientData.licenseNumber}
                            onChange={(e) => setNewClientData({ ...newClientData, licenseNumber: e.target.value })}
                            className="input-enhanced py-2 sm:py-2.5 text-sm"
                            placeholder="99 99 123456"
                          />
                        </div>
                        <DatePicker
                          label="ВУ до"
                          value={newClientData.licenseExpiry}
                          onChange={(value) => setNewClientData({ ...newClientData, licenseExpiry: value })}
                        />
                        <DatePicker
                          label="Дата рождения"
                          value={newClientData.birthDate}
                          onChange={(value) => setNewClientData({ ...newClientData, birthDate: value })}
                        />
                        <div className="sm:col-span-2">
                          <label className="form-label required text-[10px] sm:text-xs">Адрес</label>
                          <input
                            type="text"
                            required
                            value={newClientData.address}
                            onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                            className="input-enhanced py-2 sm:py-2.5 text-sm"
                            placeholder="г. Москва, ул. Примерная, д. 1"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateClient}
                        disabled={isCreatingClient || !newClientData.fullName || !newClientData.phone}
                        className="w-full btn btn-primary py-2 sm:py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingClient ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Создание...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <CheckIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Создать и выбрать</span>
                            <span className="sm:hidden">Создать</span>
                          </span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <>
                      <CustomSelect
                        options={clients.map(c => ({
                          value: c.id,
                          label: c.fullName,
                          sublabel: c.phone,
                        }))}
                        value={formData.clientId}
                        onChange={(value) => setFormData({ ...formData, clientId: value })}
                        placeholder="Выберите клиента"
                        searchPlaceholder="Поиск по имени или телефону..."
                        icon={<UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                      />
                      {selectedClient && (
                        <div className="mt-3 p-3 sm:p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
                          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-5">
                            <div className="flex items-center gap-2 sm:gap-2.5">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                                <PhoneIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">Телефон</p>
                                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">{selectedClient.phone}</p>
                              </div>
                            </div>
                            <div className="hidden sm:block w-px h-10 bg-gray-200 dark:bg-zinc-700" />
                            <div className="flex items-center gap-2 sm:gap-2.5">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                                <IdCardIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">ВУ до</p>
                                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{new Date(selectedClient.licenseExpiry).toLocaleDateString('ru-RU')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Dates Section */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500">
                  <CalendarIcon className="w-full h-full" />
                </span>
                Сроки аренды
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <DatePicker
                  label="Дата начала"
                  value={formData.startDate}
                  onChange={(value) => setFormData({ ...formData, startDate: value })}
                />
                <DatePicker
                  label="Дата окончания"
                  value={formData.plannedEndDate}
                  onChange={(value) => setFormData({ ...formData, plannedEndDate: value })}
                />
              </div>
            </div>

            {/* Financial Section */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500">
                  <CurrencyIcon className="w-full h-full" />
                </span>
                Оплата
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                <SelectDropdown
                  label="Тариф"
                  value={formData.rateType}
                  onChange={(value) => setFormData({ ...formData, rateType: value as RateType })}
                  options={Object.entries(rateLabels).map(([value, label]) => ({ value, label }))}
                />
                <div>
                  <label className="form-label required text-[10px] sm:text-xs">Сумма</label>
                  <div className="relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">฿</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.rateAmount}
                      onChange={(e) => setFormData({ ...formData, rateAmount: parseFloat(e.target.value) })}
                      className="input-enhanced py-2 sm:py-3 pl-7 sm:pl-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label text-[10px] sm:text-xs">Залог</label>
                  <div className="relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">฿</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) })}
                      className="input-enhanced py-2 sm:py-3 pl-7 sm:pl-8 text-sm"
                    />
                  </div>
                </div>
                <SelectDropdown
                  label="Оплата"
                  value={formData.paymentMethod}
                  onChange={(value) => setFormData({ ...formData, paymentMethod: value as PaymentMethod })}
                  options={Object.entries(paymentLabels).map(([value, label]) => ({ value, label }))}
                />
              </div>
            </div>

            {/* Vehicle State Section */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500">
                  <GaugeIcon className="w-full h-full" />
                </span>
                Состояние авто
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="form-label text-[10px] sm:text-xs">Пробег при выдаче</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.mileageStart}
                        onChange={(e) => setFormData({ ...formData, mileageStart: parseInt(e.target.value) })}
                        className="input-enhanced py-2 sm:py-3 pr-10 sm:pr-12 text-sm"
                      />
                      <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-gray-400">км</span>
                    </div>
                  </div>
                  <div>
                    <label className="form-label text-[10px] sm:text-xs">Уровень топлива</label>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {[0, 25, 50, 75, 100].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({ ...formData, fuelLevelStart: level })}
                          className={clsx(
                            'flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-200',
                            formData.fuelLevelStart === level
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-100 dark:border-zinc-700'
                          )}
                        >
                          {level === 0 ? 'E' : level === 100 ? 'F' : `${level}%`}
                        </button>
                      ))}
                    </div>
                    <div className="mt-1.5 sm:mt-2 h-2 sm:h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-300"
                        style={{ width: `${formData.fuelLevelStart}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="form-label text-[10px] sm:text-xs">Состояние при выдаче</label>
                  <textarea
                    value={formData.conditionStart}
                    onChange={(e) => setFormData({ ...formData, conditionStart: e.target.value })}
                    rows={2}
                    className="input-enhanced py-2 sm:py-3 resize-none text-sm"
                    placeholder="Царапины, вмятины, повреждения..."
                  />
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="form-label text-[10px] sm:text-xs">Заметки</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="input-enhanced py-2 sm:py-3 resize-none text-sm"
                placeholder="Дополнительная информация..."
              />
            </div>
          </form>

          {/* Footer */}
          <div className="modal-footer flex gap-2 sm:gap-3 p-4 sm:p-6">
            <button type="button" onClick={onClose} className="flex-1 btn btn-secondary py-2.5 sm:py-3 text-sm sm:text-base">
              Отмена
            </button>
            <button onClick={handleSubmit} className="flex-1 btn btn-primary py-2.5 sm:py-3 text-sm sm:text-base">
              <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">{rental ? 'Сохранить изменения' : 'Создать аренду'}</span>
              <span className="sm:hidden">{rental ? 'Сохранить' : 'Создать'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 104 0 2 2 0 00-4 0zM5 17H4a2 2 0 01-2-2v-4a2 2 0 012-2h1.586a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293h5.172a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H20a2 2 0 012 2v4a2 2 0 01-2 2h-1" />
    </svg>
  )
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function CurrencyBahtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
    </svg>
  )
}

function SpeedometerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  )
}

function IdCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
    </svg>
  )
}

function FuelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h10.5M3.75 21V6a2.25 2.25 0 012.25-2.25h6a2.25 2.25 0 012.25 2.25v15M3.75 21h-1.5m12-14.25h2.25a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5h-.75M14.25 6.75v3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 9v6.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9h6v4.5H6z" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
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

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  )
}
