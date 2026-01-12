import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { DashboardStats, Rental, Notification } from '@/types'
import clsx from 'clsx'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activeRentals, setActiveRentals] = useState<Rental[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, rentalsRes, notificationsRes] = await Promise.all([
        fetch('/api/reports/summary'),
        fetch('/api/rentals/active'),
        fetch('/api/notifications?limit=5'),
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary-200 dark:border-primary-900" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between order-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Главная</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Обзор системы управления арендой</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Quick actions - показываем первым на мобильных */}
      <div className="order-2 md:order-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm p-5 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickActionCard
            href="/rentals?action=new"
            icon={<PlusIcon className="w-6 h-6" />}
            label="Новая аренда"
          />
          <QuickActionCard
            href="/vehicles?action=new"
            icon={<CarIcon className="w-6 h-6" />}
            label="Добавить авто"
          />
          <QuickActionCard
            href="/clients?action=new"
            icon={<UserPlusIcon className="w-6 h-6" />}
            label="Добавить клиента"
          />
          <QuickActionCard
            href="/finances"
            icon={<ChartIcon className="w-6 h-6" />}
            label="Отчёты"
          />
        </div>
      </div>

      {/* Stats cards - показываем последним на мобильных */}
      <div className="order-4 md:order-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Активные аренды"
          value={stats?.activeRentals?.toString() ?? '0'}
          icon={<TrendIcon className="w-5 h-5" />}
          index={0}
        />
        <StatCard
          title="Свободные авто"
          value={stats?.availableVehicles?.toString() ?? '0'}
          icon={<CarIcon className="w-5 h-5" />}
          index={1}
        />
        <StatCard
          title="Доход за месяц"
          value={formatCurrency(stats?.monthlyIncome ?? 0)}
          icon={<WalletIcon />}
          index={2}
        />
        <StatCard
          title="Ближ. возврат"
          value={stats?.nextReturn ? `${stats.nextReturn.hoursRemaining}ч` : '-'}
          icon={<ClockIcon />}
          index={3}
        />
      </div>

      <div className="order-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active rentals */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm p-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Активные аренды</h2>
            <Link
              to="/rentals"
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Все аренды →
            </Link>
          </div>

          {activeRentals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ClipboardIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Нет активных аренд</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeRentals.slice(0, 5).map((rental) => (
                <div
                  key={rental.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center">
                      <CarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {rental.vehicle?.brand} {rental.vehicle?.model}
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        {rental.client?.fullName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      до {formatDate(rental.plannedEndDate)}
                    </p>
                    <p className="text-xs font-mono text-gray-400 dark:text-gray-500">
                      {rental.vehicle?.licensePlate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm p-5 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Уведомления</h2>
            {notifications.length > 0 && (
              <span className="text-xs font-medium px-2 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-500">{notifications.length}</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BellIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Нет уведомлений</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={clsx(
                    'p-3 rounded-xl border',
                    notification.isRead
                      ? 'bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-700/50'
                      : 'bg-gray-100 dark:bg-zinc-800/70 border-gray-200 dark:border-zinc-600/50'
                  )}
                >
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  index,
}: {
  title: string
  value: string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'orange'
  index: number
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <span className="text-gray-400 dark:text-gray-500 mb-3">{icon}</span>
      <p className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-2">{title}</p>
    </div>
  )
}

function QuickActionCard({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
  color?: 'primary' | 'green' | 'purple' | 'orange'
}) {
  return (
    <Link
      to={href}
      className="flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:border-gray-200 dark:hover:border-zinc-600 transition-all"
    >
      <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
    </Link>
  )
}

// Icons
function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 104 0 2 2 0 00-4 0zM5 17H4a2 2 0 01-2-2v-4a2 2 0 012-2h1.586a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293h5.172a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H20a2 2 0 012 2v4a2 2 0 01-2 2h-1" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function TrendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h4l3-9 6 18 3-9h4" />
    </svg>
  )
}

