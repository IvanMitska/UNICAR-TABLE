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

export default function FinancesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
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
      const [expensesRes, vehiclesRes, statsRes] = await Promise.all([
        fetch(`/api/expenses?from=${dateRange.from}&to=${dateRange.to}`),
        fetch('/api/vehicles'),
        fetch(`/api/reports/summary?from=${dateRange.from}&to=${dateRange.to}`),
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
