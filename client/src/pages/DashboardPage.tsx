import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { DashboardStats, Rental, Notification, BookingRequest } from '@/types'
import clsx from 'clsx'
import {
  Plus, Undo2, CalendarClock, UserPlus, AlertTriangle, Clock, Inbox,
  ChevronRight, Calendar, KeyRound, CheckCircle2, Wrench, Banknote,
} from 'lucide-react'

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

/* ---------- Animated count-up hook (respects reduced motion) ---------- */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>()
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || target === 0) {
      setValue(target)
      return
    }
    const start = performance.now()
    const from = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setValue(from + (target - from) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else setValue(target)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])
  return value
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
      if (statsRes.ok) setStats(await statsRes.json())
      if (rentalsRes.ok) setActiveRentals(await rentalsRes.json())
      if (notificationsRes.ok) setNotifications(await notificationsRes.json())
      if (popularityRes.ok) setPopularity(await popularityRes.json())
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const totalVehicles = (stats?.availableVehicles ?? 0) + (stats?.activeRentals ?? 0) + (stats?.maintenanceVehicles ?? 0)
  const utilizationPercent = totalVehicles > 0 ? Math.round(((stats?.activeRentals ?? 0) / totalVehicles) * 100) : 0

  const getUtilization = (percent: number) => {
    if (percent < 40) return { color: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', status: 'Низкая загрузка' }
    if (percent < 70) return { color: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', status: 'Оптимально' }
    return { color: '#3b82f6', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', status: 'Высокий спрос' }
  }
  const util = getUtilization(utilizationPercent)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  const returnsToday = activeRentals.filter(r => {
    const e = new Date(r.plannedEndDate); return e >= todayStart && e < todayEnd
  })
  const overdueRentals = activeRentals.filter(r => new Date(r.plannedEndDate) < todayStart)
  const urgentCount = overdueRentals.length + pendingBookings.length + notifications.filter(n => !n.isRead).length

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[88px] rounded-2xl skeleton" />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[116px] rounded-[18px] skeleton" />)}
        </div>
        <div className="h-[148px] rounded-2xl skeleton" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-[220px] rounded-2xl skeleton" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-animation">
        <QuickAction icon={<PlusIcon />} label="Новая аренда" onClick={() => navigate('/rentals?action=new')} primary />
        <QuickAction icon={<ReturnIcon />} label="Возврат" onClick={() => navigate('/rentals?action=return')} />
        <QuickAction icon={<ExtendIcon />} label="Продлить" onClick={() => navigate('/rentals?action=extend')} />
        <QuickAction icon={<UserPlusIcon />} label="Новый клиент" onClick={() => navigate('/clients?action=new')} />
      </div>

      {/* Needs Attention */}
      {urgentCount > 0 && (
        <section className="card stripe-l p-4 fade-up" style={{ ['--stripe' as string]: '#f59e0b', background: 'var(--accent-soft)', borderColor: 'var(--accent-soft-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="icon-soft icon-soft-amber w-7 h-7"><AlertIcon className="w-4 h-4" /></span>
            <h2 className="text-[13.5px] font-semibold" style={{ color: 'var(--accent)' }}>Требует внимания</h2>
            <span className="ml-auto pill pill-warning">{urgentCount}</span>
          </div>
          <div className="space-y-2">
            {overdueRentals.slice(0, 2).map(rental => (
              <Link key={rental.id} to={`/rentals/${rental.id}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors group">
                <span className="icon-soft icon-soft-rose w-8 h-8"><ClockIcon className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-[var(--ink)] truncate">Просрочен возврат: {rental.vehicle?.brand} {rental.vehicle?.model}</p>
                  <p className="text-[11.5px] text-[var(--ink-muted)] truncate">{rental.client?.fullName} • Срок истёк {formatDate(rental.plannedEndDate)}</p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-[var(--ink-subtle)] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
            {pendingBookings.slice(0, 2).map(booking => (
              <Link key={booking.id} to={`/booking-requests/${booking.id}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors group">
                <span className="icon-soft icon-soft-blue w-8 h-8"><InboxIcon className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-[var(--ink)] truncate">Новая заявка: {booking.customerFirstName} {booking.customerLastName}</p>
                  <p className="text-[11.5px] text-[var(--ink-muted)] truncate">{booking.vehicle?.brand} {booking.vehicle?.model} • {formatDate(booking.startDate)}</p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-[var(--ink-subtle)] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Returns Today */}
      {returnsToday.length > 0 && (
        <section className="card stripe-l p-4 fade-up" style={{ ['--stripe' as string]: '#3b82f6' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="icon-soft icon-soft-blue w-7 h-7"><CalendarIcon className="w-4 h-4" /></span>
            <h2 className="text-[13.5px] font-semibold text-[var(--ink-2)]">Возвраты сегодня</h2>
            <span className="ml-auto pill pill-info">{returnsToday.length}</span>
          </div>
          <div className="space-y-2">
            {returnsToday.slice(0, 3).map(rental => (
              <Link key={rental.id} to={`/rentals/${rental.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-[var(--ink)] truncate">{rental.vehicle?.brand} {rental.vehicle?.model}</p>
                  <p className="text-[11.5px] text-[var(--ink-muted)]">{rental.client?.fullName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-blue-600 dark:text-blue-400">{formatTime(rental.plannedEndDate)}</p>
                  <p className="text-[10px] font-mono text-[var(--ink-subtle)]">{rental.vehicle?.licensePlate}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-animation">
        <StatCard label="В аренде" value={stats?.activeRentals ?? 0} subtitle={`из ${totalVehicles} авто`} tone="amber" icon={<KeyMini />} />
        <StatCard label="Свободно" value={stats?.availableVehicles ?? 0} subtitle="готовы к аренде" tone="emerald" icon={<CheckMini />} />
        <StatCard label="На ТО" value={stats?.maintenanceVehicles ?? 0} subtitle="в обслуживании" tone={(stats?.maintenanceVehicles ?? 0) > 2 ? 'rose' : 'neutral'} icon={<WrenchMini />} />
        <StatCard label="Доход" value={stats?.monthlyIncome ?? 0} format={formatCurrency} subtitle="за этот месяц" tone="neutral" icon={<CoinMini />} />
      </div>

      {/* Fleet Utilization — radial gauge + legend */}
      <section className="card p-5 fade-up">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <RadialGauge percent={utilizationPercent} color={util.color} />
          <div className="flex-1 w-full min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-[14px] font-semibold text-[var(--ink-2)]">Загруженность парка</h2>
              <span className={clsx('text-[11px] font-medium px-2 py-0.5 rounded-full', util.text, util.bg)}>{util.status}</span>
            </div>
            <div className="space-y-2.5">
              <FleetRow color="#10b981" label="В аренде" value={stats?.activeRentals ?? 0} total={totalVehicles} />
              <FleetRow color="var(--border-strong)" label="Свободно" value={stats?.availableVehicles ?? 0} total={totalVehicles} />
              <FleetRow color="#f59e0b" label="На ТО" value={stats?.maintenanceVehicles ?? 0} total={totalVehicles} />
            </div>
          </div>
        </div>
      </section>

      {/* Active Rentals + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="card card-hover p-5 fade-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-[var(--ink-2)]">Активные аренды</h2>
              {activeRentals.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />}
            </div>
            <Link to="/rentals" className="text-[12px] font-medium text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors">Все →</Link>
          </div>
          {activeRentals.length === 0 ? (
            <EmptyMini text="Нет активных аренд" />
          ) : (
            <div className="space-y-0.5">
              {activeRentals.slice(0, 5).map((rental) => (
                <div key={rental.id} className="flex items-center gap-3 p-3 -mx-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-[var(--ink)] truncate">{rental.vehicle?.brand} {rental.vehicle?.model}</p>
                    <p className="text-[11.5px] text-[var(--ink-muted)] truncate">{rental.client?.fullName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-medium text-[var(--ink-2)]">до {formatDate(rental.plannedEndDate)}</p>
                    <p className="text-[10px] font-mono text-[var(--ink-subtle)]">{rental.vehicle?.licensePlate}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card card-hover p-5 fade-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-[var(--ink-2)]">Уведомления</h2>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: 'var(--accent-bright)', color: '#1a1205' }}>
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </div>
          </div>
          {notifications.length === 0 ? (
            <EmptyMini text="Нет уведомлений" />
          ) : (
            <div className="space-y-0.5">
              {notifications.map((notification) => (
                <div key={notification.id} className={clsx('p-3 -mx-2 rounded-xl transition-colors cursor-pointer', notification.isRead ? 'hover:bg-[var(--surface-2)]' : 'bg-[var(--surface-2)]')}>
                  <div className="flex items-start gap-2.5">
                    {!notification.isRead && <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent-strong)' }} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium text-[var(--ink)]">{notification.title}</p>
                      <p className="text-[11.5px] text-[var(--ink-muted)] mt-0.5 line-clamp-1">{notification.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Vehicle Popularity — relative bars */}
      {popularity && (popularity.mostRented.length > 0 || popularity.leastRented.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PopularityCard title="Популярные автомобили" items={popularity.mostRented} accent="#f59e0b" />
          <PopularityCard title="Низкий спрос" items={popularity.leastRented} accent="var(--border-strong)" muted />
        </div>
      )}
    </div>
  )
}

/* ===================== Sub-components ===================== */

function QuickAction({ icon, label, onClick, primary, tone = 'neutral' }: {
  icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean
  tone?: 'neutral' | 'blue' | 'emerald' | 'purple'
}) {
  if (primary) {
    return (
      <button onClick={onClick}
        className="group relative overflow-hidden flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-transform active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#1a1205', boxShadow: '0 8px 24px -10px rgba(245,158,11,0.6)' }}>
        <span className="liquid-shine absolute inset-0" />
        <span className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(26,18,5,0.12)' }}>{icon}</span>
        <span className="relative text-[12.5px] font-semibold">{label}</span>
      </button>
    )
  }
  return (
    <button onClick={onClick} className="card card-hover group flex flex-col items-center justify-center gap-2 p-4 active:scale-[0.98]">
      <span className={clsx('icon-soft w-9 h-9', `icon-soft-${tone === 'neutral' ? 'neutral' : tone}`)}>{icon}</span>
      <span className="text-[12.5px] font-medium text-[var(--ink-2)]">{label}</span>
    </button>
  )
}

function StatCard({ label, value, format, subtitle, tone, icon }: {
  label: string; value: number; format?: (n: number) => string; subtitle?: string
  tone: 'amber' | 'emerald' | 'rose' | 'neutral'; icon: React.ReactNode
}) {
  const animated = useCountUp(value)
  const display = format ? format(animated) : Math.round(animated).toLocaleString('ru-RU')
  return (
    <div className="stat-card card-hover">
      <div className="flex items-start justify-between mb-2.5">
        <span className={clsx('icon-soft w-9 h-9', `icon-soft-${tone}`)}>{icon}</span>
      </div>
      <p className="eyebrow mb-1">{label}</p>
      <p className="text-[26px] leading-none font-bold tracking-tight num-roll text-[var(--ink)]">{display}</p>
      {subtitle && <p className="text-[11.5px] text-[var(--ink-muted)] mt-1.5">{subtitle}</p>}
    </div>
  )
}

function RadialGauge({ percent, color }: { percent: number; color: string }) {
  const [mounted, setMounted] = useState(false)
  const display = useCountUp(percent, 1000)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const size = 132, stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r
  const offset = mounted ? c - (percent / 100) * c : c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.25,1,0.5,1)', filter: `drop-shadow(0 0 6px ${color}55)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-bold tracking-tight num-roll text-[var(--ink)]">{Math.round(display)}%</span>
        <span className="eyebrow !text-[9px] mt-0.5">загрузка</span>
      </div>
    </div>
  )
}

function FleetRow({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  const [w, setW] = useState(0)
  const pct = total > 0 ? (value / total) * 100 : 0
  useEffect(() => { const t = setTimeout(() => setW(pct), 80); return () => clearTimeout(t) }, [pct])
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-[110px] shrink-0">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-[12.5px] text-[var(--ink-muted)]">{label}</span>
      </div>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${w}%`, background: color, transition: 'width 0.9s cubic-bezier(0.25,1,0.5,1)' }} />
      </div>
      <span className="text-[13px] font-semibold text-[var(--ink)] w-7 text-right num-roll">{value}</span>
    </div>
  )
}

function PopularityCard({ title, items, accent, muted }: {
  title: string; items: VehiclePopularity[]; accent: string; muted?: boolean
}) {
  const max = Math.max(1, ...items.map(i => i.rentalCount))
  return (
    <section className="card card-hover p-5 fade-up">
      <h2 className="text-[14px] font-semibold text-[var(--ink-2)] mb-4">{title}</h2>
      {items.length === 0 ? <EmptyMini text="Нет данных" /> : (
        <div className="space-y-1">
          {items.map((v, i) => (
            <div key={v.id} className="flex items-center gap-3 p-2.5 -mx-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors">
              <span className="w-5 text-[12px] font-semibold text-[var(--ink-subtle)] text-center num-roll">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-[var(--ink)] truncate">{v.brand} {v.model}</p>
                <div className="mt-1.5 h-1 rounded-full bg-[var(--surface-3)] overflow-hidden">
                  <div className="h-full rounded-full spark-grow" style={{ width: `${(v.rentalCount / max) * 100}%`, background: accent }} />
                </div>
              </div>
              <span className={clsx('text-[13px] font-semibold num-roll', muted ? 'text-[var(--ink-subtle)]' : 'text-[var(--ink)]')}>{v.rentalCount}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-[13px] text-[var(--ink-subtle)]">{text}</p>
    </div>
  )
}

/* ===================== Icons (lucide) ===================== */
function PlusIcon() { return <Plus className="w-5 h-5" /> }
function ReturnIcon() { return <Undo2 className="w-5 h-5" /> }
function ExtendIcon() { return <CalendarClock className="w-5 h-5" /> }
function UserPlusIcon() { return <UserPlus className="w-5 h-5" /> }
function AlertIcon({ className }: { className?: string }) { return <AlertTriangle className={className || 'w-4 h-4'} /> }
function ClockIcon({ className }: { className?: string }) { return <Clock className={className || 'w-4 h-4'} /> }
function InboxIcon({ className }: { className?: string }) { return <Inbox className={className || 'w-4 h-4'} /> }
function ChevronRightIcon({ className }: { className?: string }) { return <ChevronRight className={className || 'w-4 h-4'} /> }
function CalendarIcon({ className }: { className?: string }) { return <Calendar className={className || 'w-4 h-4'} /> }
function KeyMini() { return <KeyRound className="w-[18px] h-[18px]" /> }
function CheckMini() { return <CheckCircle2 className="w-[18px] h-[18px]" /> }
function WrenchMini() { return <Wrench className="w-[18px] h-[18px]" /> }
function CoinMini() { return <Banknote className="w-[18px] h-[18px]" /> }
