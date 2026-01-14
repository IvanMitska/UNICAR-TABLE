import { useState, useEffect } from 'react'
import type { Expense, Vehicle, ExpenseFormData, ExpenseCategory } from '@/types'
import clsx from 'clsx'
import DatePicker from '@/components/ui/DatePicker'
import SelectDropdown from '@/components/ui/SelectDropdown'

const categoryLabels: Record<ExpenseCategory, string> = {
  maintenance: 'Обслуживание',
  insurance: 'Страховка',
  fuel: 'Топливо',
  fine: 'Штраф',
  other: 'Прочее',
}

const categoryColors: Record<ExpenseCategory, string> = {
  maintenance: 'badge-warning',
  insurance: 'badge-info',
  fuel: 'badge-success',
  fine: 'badge-danger',
  other: 'badge-gray',
}

interface VehicleStats {
  id: number
  brand: string
  model: string
  licensePlate: string
  status: string
  rentalCount: number
  totalRevenue: number
}

interface RentalIncome {
  id: number
  vehicleBrand: string
  vehicleModel: string
  vehiclePlate: string
  clientName: string
  startDate: string
  endDate: string
  totalAmount: number
  status: string
}

export default function FinancesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleStats, setVehicleStats] = useState<VehicleStats[]>([])
  const [activeRentals, setActiveRentals] = useState<RentalIncome[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    profit: 0,
  })

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const fetchData = async () => {
    try {
      const [expensesRes, vehiclesRes, statsRes, popularityRes, rentalsRes] = await Promise.all([
        fetch(`/api/expenses?from=${dateRange.from}&to=${dateRange.to}`),
        fetch('/api/vehicles'),
        fetch(`/api/reports/summary?from=${dateRange.from}&to=${dateRange.to}`),
        fetch('/api/reports/vehicle-popularity'),
        fetch('/api/rentals/active'),
      ])

      if (expensesRes.ok) setExpenses(await expensesRes.json())
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json())
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats({
          totalIncome: data.totalIncome || 0,
          totalExpenses: data.totalExpenses || 0,
          profit: (data.totalIncome || 0) - (data.totalExpenses || 0),
        })
      }
      if (popularityRes.ok) {
        const data = await popularityRes.json()
        setVehicleStats(data.all || [])
      }
      if (rentalsRes.ok) {
        const data = await rentalsRes.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedRentals = data.map((r: any) => ({
          id: r.id,
          vehicleBrand: r.vehicle?.brand || '',
          vehicleModel: r.vehicle?.model || '',
          vehiclePlate: r.vehicle?.licensePlate || '',
          clientName: r.client?.fullName || '',
          startDate: r.startDate,
          endDate: r.plannedEndDate,
          totalAmount: r.totalAmount || 0,
          status: r.status,
        }))
        setActiveRentals(mappedRentals)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (data: ExpenseFormData) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        fetchData()
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error('Failed to save expense:', error)
    }
  }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Финансы</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Добавить расход
        </button>
      </div>

      {/* Date range filter */}
      <div className="flex flex-wrap items-end gap-4">
        <DatePicker
          label="От"
          value={dateRange.from}
          onChange={(value) => setDateRange({ ...dateRange, from: value })}
          className="w-48"
        />
        <span className="text-gray-400 pb-3">—</span>
        <DatePicker
          label="До"
          value={dateRange.to}
          onChange={(value) => setDateRange({ ...dateRange, to: value })}
          className="w-48"
        />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <span className="text-gray-400 dark:text-gray-500 mb-2">
            <ArrowUpIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(stats.totalIncome)}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">Доход</p>
        </div>
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <span className="text-gray-400 dark:text-gray-500 mb-2">
            <ArrowDownIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(stats.totalExpenses)}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">Расходы</p>
        </div>
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <span className="text-gray-400 dark:text-gray-500 mb-2">
            <WalletIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(stats.profit)}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">Прибыль</p>
        </div>
      </div>

      {/* Two column layout for analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Rentals Income */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUpIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Активные аренды</h2>
                <p className="text-xs text-gray-500">Текущий доход</p>
              </div>
            </div>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(activeRentals.reduce((sum, r) => sum + r.totalAmount, 0))}
            </span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-80 overflow-y-auto">
            {activeRentals.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Нет активных аренд</p>
              </div>
            ) : (
              activeRentals.map((rental) => (
                <div key={rental.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {rental.vehicleBrand} {rental.vehicleModel}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{rental.clientName}</p>
                  </div>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 ml-4">
                    +{formatCurrency(rental.totalAmount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Vehicles by Revenue */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Топ машин по доходу</h2>
              <p className="text-xs text-gray-500">За всё время</p>
            </div>
          </div>
          <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
            {vehicleStats.filter(v => v.totalRevenue > 0).slice(0, 10).map((vehicle, index) => {
              const maxRevenue = Math.max(...vehicleStats.map(v => v.totalRevenue), 1)
              const percentage = (vehicle.totalRevenue / maxRevenue) * 100
              return (
                <div key={vehicle.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {vehicle.brand} {vehicle.model}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(vehicle.totalRevenue)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{vehicle.licensePlate}</span>
                    <span>{vehicle.rentalCount} аренд</span>
                  </div>
                </div>
              )
            })}
            {vehicleStats.filter(v => v.totalRevenue > 0).length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Нет данных о доходах</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fleet Overview */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <CarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Обзор автопарка</h2>
            <p className="text-xs text-gray-500">Статус и доходность</p>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {vehicles.filter(v => v.status === 'rented').length}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">В аренде</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {vehicles.filter(v => v.status === 'available').length}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Свободно</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {vehicles.filter(v => v.status === 'maintenance').length}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">На ТО</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {vehicles.length}
            </p>
            <p className="text-xs text-gray-500 font-medium">Всего машин</p>
          </div>
        </div>
      </div>

      {/* Expenses list */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Расходы</h2>
        </div>
        {expenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
              <WalletIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Нет расходов за этот период</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={clsx('badge', categoryColors[expense.category])}>
                      {categoryLabels[expense.category]}
                    </span>
                    <span className="text-sm text-gray-500">{formatDate(expense.date)}</span>
                  </div>
                  <p className="text-gray-900 dark:text-white">{expense.description}</p>
                  {expense.vehicle && (
                    <p className="text-sm text-gray-500">
                      {expense.vehicle.brand} {expense.vehicle.model}
                    </p>
                  )}
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  -{formatCurrency(expense.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ExpenseModal
          vehicles={vehicles}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function ExpenseModal({
  vehicles,
  onClose,
  onSave,
}: {
  vehicles: Vehicle[]
  onClose: () => void
  onSave: (data: ExpenseFormData) => void
}) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    category: 'maintenance',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-zinc-800">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
                <WalletIcon className="w-5 h-5 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Добавить расход</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <SelectDropdown
                label="Категория"
                required
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value as ExpenseCategory })}
                options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
              />
              <DatePicker
                label="Дата"
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
              />
            </div>

            <SelectDropdown
              label="Автомобиль"
              value={formData.vehicleId?.toString() ?? ''}
              onChange={(value) => setFormData({ ...formData, vehicleId: value ? parseInt(value) : undefined })}
              options={[
                { value: '', label: 'Без автомобиля' },
                ...vehicles.map((vehicle) => ({
                  value: vehicle.id.toString(),
                  label: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`
                }))
              ]}
              placeholder="Выберите автомобиль"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Сумма *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Описание *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="input"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">
                Отмена
              </button>
              <button type="submit" className="flex-1 btn btn-primary">
                Добавить
              </button>
            </div>
          </form>
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

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
    </svg>
  )
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
    </svg>
  )
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v8H3v-8zm6-4h2v12H9V9zm6-6h2v18h-2V3zm6 10h2v8h-2v-8z" />
    </svg>
  )
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 104 0 2 2 0 00-4 0zM5 17H4a2 2 0 01-2-2v-4a2 2 0 012-2h1.586a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293h5.172a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H20a2 2 0 012 2v4a2 2 0 01-2 2h-1" />
    </svg>
  )
}
