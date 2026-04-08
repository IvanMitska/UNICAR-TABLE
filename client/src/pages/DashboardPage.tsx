import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { DashboardStats, Rental, Notification, BookingRequest } from '@/types'
import clsx from 'clsx'

interface VehiclePopularity {
  id: number
  brand: string
  model: string
  licensePlate: string
  rentalCount: number
  totalRevenue: number
}

interface PopularityData {
  mostRented: VehiclePopularity[]
  leastRented: VehiclePopularity[]
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activeRentals, setActiveRentals] = useState<Rental[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [popularity, setPopularity] = useState<PopularityData | null>(null)
  const [pendingBookings, setPendingBookings] = useState<BookingRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, rentalsRes, notificationsRes, popularityRes, bookingsRes] = await Promise.all([
        fetch('/api/reports/summary'),
        fetch('/api/rentals/active'),
        fetch('/api/notifications?limit=5'),
        fetch('/api/reports/vehicle-popularity'),
        fetch('/api/booking-requests?status=pending&limit=5'),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }

      if (rentalsRes.ok) {
        const data = await rentalsRes.json()
        setActiveRentals(data)
      }

      if (notificationsRes.ok) {
        const data = await notificationsRes.json()
        setNotifications(data)
      }

      if (popularityRes.ok) {
        const data = await popularityRes.json()
        setPopularity(data)
      }

      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setPendingBookings(Array.isArray(data) ? data : data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calculate fleet utilization
  const totalVehicles = (stats?.availableVehicles ?? 0) + (stats?.activeRentals ?? 0) + (stats?.maintenanceVehicles ?? 0)
  const utilizationPercent = totalVehicles > 0 ? Math.round(((stats?.activeRentals ?? 0) / totalVehicles) * 100) : 0

  // Get utilization status color
  const getUtilizationColor = (percent: number) => {
    if (percent < 40) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', status: 'Низкая загрузка' }
    if (percent < 70) return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', status: 'Оптимально' }
    return { bar: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', status: 'Высокий спрос' }
  }

  const utilizationStatus = getUtilizationColor(utilizationPercent)

  // Filter rentals returning today or overdue
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const returnsToday = activeRentals.filter(r => {
    const endDate = new Date(r.plannedEndDate)
    return endDate >= todayStart && endDate < todayEnd
  })

  const overdueRentals = activeRentals.filter(r => {
    const endDate = new Date(r.plannedEndDate)
    return endDate < todayStart
  })

  // Count urgent items
  const urgentCount = overdueRentals.length + pendingBookings.length + notifications.filter(n => !n.isRead).length

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto animate-pulse">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-800 rounded mb-2" />
            <div className="h-6 w-24 bg-gray-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="h-9 w-32 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
        </div>

        {/* Skeleton Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4">
              <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800 rounded mb-2" />
              <div className="h-7 w-12 bg-gray-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>

        {/* Skeleton Utilization */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5">
          <div className="flex justify-between mb-4">
            <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-8 bg-gray-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="h-2 w-full bg-gray-200 dark:bg-zinc-800 rounded-full" />
        </div>

        {/* Skeleton Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5">
              <div className="h-4 w-28 bg-gray-200 dark:bg-zinc-800 rounded mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded mb-1" />
                      <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="h-4 w-12 bg-gray-200 dark:bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto">
      {/* Quick Actions - Primary CTA buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up">
        <QuickActionButton
          icon={<PlusIcon className="w-5 h-5" />}
          label="Новая аренда"
          onClick={() => navigate('/rentals?action=new')}
          primary
        />
        <QuickActionButton
          icon={<ReturnIcon className="w-5 h-5" />}
          label="Возврат"
          onClick={() => navigate('/rentals?action=return')}
        />
        <QuickActionButton
          icon={<ExtendIcon className="w-5 h-5" />}
          label="Продлить"
          onClick={() => navigate('/rentals?action=extend')}
        />
        <QuickActionButton
          icon={<UserPlusIcon className="w-5 h-5" />}
          label="Новый клиент"
          onClick={() => navigate('/clients?action=new')}
        />
      </div>

      {/* Needs Attention - Only shows when there are urgent items */}
      {urgentCount > 0 && (
        <section className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <AlertIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Требует внимания
            </h2>
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
              {urgentCount}
            </span>
          </div>

          <div className="space-y-2">
            {/* Overdue Rentals */}
            {overdueRentals.slice(0, 2).map(rental => (
              <Link
                key={rental.id}
                to={`/rentals/${rental.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ClockIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Просрочен возврат: {rental.vehicle?.brand} {rental.vehicle?.model}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {rental.client?.fullName} • Срок истек {formatDate(rental.plannedEndDate)}
                  </p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              </Link>
            ))}

            {/* Pending Bookings */}
            {pendingBookings.slice(0, 2).map(booking => (
              <Link
                key={booking.id}
                to={`/booking-requests/${booking.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <InboxIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Новая заявка: {booking.customerFirstName} {booking.customerLastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {booking.vehicle?.brand} {booking.vehicle?.model} • {formatDate(booking.startDate)}
                  </p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              </Link>
            ))}

            {/* Unread Notifications */}
            {notifications.filter(n => !n.isRead).slice(0, 2).map(notification => (
              <div
                key={notification.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-zinc-900 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <BellIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {notification.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Returns Today - Only shows if there are returns */}
      {returnsToday.length > 0 && (
        <section className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              Возвраты сегодня
            </h2>
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {returnsToday.length}
            </span>
          </div>

          <div className="space-y-2">
            {returnsToday.slice(0, 3).map(rental => (
              <Link
                key={rental.id}
                to={`/rentals/${rental.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {rental.vehicle?.brand} {rental.vehicle?.model}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {rental.client?.fullName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {formatTime(rental.plannedEndDate)}
                  </p>
                  <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                    {rental.vehicle?.licensePlate}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stats Grid - With semantic colors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="В аренде"
          value={stats?.activeRentals?.toString() ?? '0'}
          subtitle={`из ${totalVehicles} авто`}
          trend={utilizationPercent < 40 ? 'low' : utilizationPercent > 70 ? 'high' : 'normal'}
        />
        <StatCard
          label="Свободно"
          value={stats?.availableVehicles?.toString() ?? '0'}
          subtitle="готовы к аренде"
          highlight={Boolean(stats?.availableVehicles && stats.availableVehicles > 0)}
        />
        <StatCard
          label="На ТО"
          value={stats?.maintenanceVehicles?.toString() ?? '0'}
          subtitle="в обслуживании"
          warning={Boolean(stats?.maintenanceVehicles && stats.maintenanceVehicles > 2)}
        />
        <StatCard
          label="Доход"
          value={formatCurrency(stats?.monthlyIncome ?? 0)}
          subtitle="за этот месяц"
        />
      </div>

      {/* Fleet Utilization - With semantic colors */}
      <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Загруженность парка
            </h2>
            <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', utilizationStatus.text, utilizationPercent < 40 ? 'bg-amber-100 dark:bg-amber-900/30' : utilizationPercent < 70 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30')}>
              {utilizationStatus.status}
            </span>
          </div>
          <span className={clsx('text-lg font-bold', utilizationStatus.text)}>
            {utilizationPercent}%
          </span>
        </div>

        {/* Progress Bar - Semantic color */}
        <div className="h-3 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden mb-4">
          <div
            className={clsx('h-full rounded-full transition-all duration-700 ease-out', utilizationStatus.bar)}
            style={{ width: `${utilizationPercent}%` }}
          />
        </div>

        {/* Fleet Status - Simple row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-gray-600 dark:text-gray-400">В аренде</span>
            <span className="font-semibold text-gray-900 dark:text-white">{stats?.activeRentals ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-zinc-600" />
            <span className="text-gray-600 dark:text-gray-400">Свободно</span>
            <span className="font-semibold text-gray-900 dark:text-white">{stats?.availableVehicles ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-gray-600 dark:text-gray-400">На ТО</span>
            <span className="font-semibold text-gray-900 dark:text-white">{stats?.maintenanceVehicles ?? 0}</span>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Rentals - Clean list */}
        <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Активные аренды
            </h2>
            <Link
              to="/rentals"
              className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Все →
            </Link>
          </div>

          {activeRentals.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">Нет активных аренд</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activeRentals.slice(0, 5).map((rental) => (
                <div
                  key={rental.id}
                  className="flex items-center gap-3 p-3 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {rental.vehicle?.brand} {rental.vehicle?.model}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {rental.client?.fullName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      до {formatDate(rental.plannedEndDate)}
                    </p>
                    <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                      {rental.vehicle?.licensePlate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notifications - Clean list */}
        <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Уведомления
              </h2>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="w-5 h-5 rounded-full bg-gray-900 dark:bg-white text-[10px] font-medium text-white dark:text-gray-900 flex items-center justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">Нет уведомлений</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={clsx(
                    'p-3 -mx-2 rounded-xl transition-colors cursor-pointer',
                    notification.isRead
                      ? 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                      : 'bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notification.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-900 dark:bg-white mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Vehicle Popularity - Clean tables */}
      {popularity && (popularity.mostRented.length > 0 || popularity.leastRented.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Most Rented */}
          <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 animate-slide-up">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
              Популярные автомобили
            </h2>

            {popularity.mostRented.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">Нет данных</p>
              </div>
            ) : (
              <div className="space-y-1">
                {popularity.mostRented.map((vehicle, index) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-3 p-3 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className="w-5 text-xs font-medium text-gray-400 dark:text-gray-500 text-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                        {vehicle.licensePlate}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {vehicle.rentalCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Least Rented */}
          <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 animate-slide-up">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
              Низкий спрос
            </h2>

            {popularity.leastRented.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">Нет данных</p>
              </div>
            ) : (
              <div className="space-y-1">
                {popularity.leastRented.map((vehicle, index) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-3 p-3 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className="w-5 text-xs font-medium text-gray-400 dark:text-gray-500 text-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                        {vehicle.licensePlate}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                      {vehicle.rentalCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

// Components

function QuickActionButton({
  icon,
  label,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all active:scale-[0.98]',
        primary
          ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
          : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

function StatCard({
  label,
  value,
  subtitle,
  trend,
  highlight,
  warning,
}: {
  label: string
  value: string
  subtitle?: string
  trend?: 'low' | 'normal' | 'high'
  highlight?: boolean
  warning?: boolean
}) {
  return (
    <div className={clsx(
      'rounded-2xl border p-4 animate-slide-up transition-colors',
      warning
        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
        : highlight
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
          : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'
    )}>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={clsx(
        'text-2xl font-semibold tracking-tight',
        warning
          ? 'text-amber-700 dark:text-amber-300'
          : highlight
            ? 'text-emerald-700 dark:text-emerald-300'
            : 'text-gray-900 dark:text-white'
      )}>
        {value}
      </p>
      {subtitle && (
        <div className="flex items-center gap-1.5 mt-0.5">
          {trend && (
            <span className={clsx(
              'text-[10px] font-medium px-1.5 py-0.5 rounded',
              trend === 'low' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
              trend === 'normal' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
              trend === 'high' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            )}>
              {trend === 'low' ? '↓' : trend === 'high' ? '↑' : '•'}
            </span>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {subtitle}
          </p>
        </div>
      )}
    </div>
  )
}

// Icons

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function ReturnIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  )
}

function ExtendIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
