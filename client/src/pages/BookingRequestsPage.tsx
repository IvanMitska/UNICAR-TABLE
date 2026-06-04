import { useState, useEffect } from 'react'
import type { BookingRequest, BookingRequestStatus } from '@/types'
import clsx from 'clsx'
import { CountUp } from '@/components/ui/CountUp'
import {
  Clock as ClockIcon, Check as CheckIcon, X as XIcon, Car as CarIcon,
  Calendar as CalendarIcon, User as UserIcon, Phone as PhoneIcon,
  Mail as MailIcon, MapPin as MapPinIcon, Inbox as InboxIcon,
} from 'lucide-react'

const API_URL = ''

const statusLabels: Record<BookingRequestStatus, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  rejected: 'Отклонено',
  completed: 'Завершено',
}

const statusPill: Record<BookingRequestStatus, string> = {
  pending: 'pill-warning',
  confirmed: 'pill-success',
  rejected: 'pill-danger',
  completed: 'pill-neutral',
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function BookingStat({ label, value, tone, icon }: {
  label: string; value: number; tone: 'amber' | 'emerald' | 'rose' | 'neutral'; icon: React.ReactNode
}) {
  return (
    <div className="stat-card card-hover">
      <span className={clsx('icon-soft w-9 h-9 mb-2.5', `icon-soft-${tone}`)}>{icon}</span>
      <p className="eyebrow mb-1">{label}</p>
      <p className="text-[26px] leading-none font-bold tracking-tight text-[var(--ink)]"><CountUp value={value} /></p>
    </div>
  )
}

export default function BookingRequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<BookingRequestStatus | 'all'>('all')
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, rejected: 0, completed: 0, total: 0 })

  // Fetch booking requests
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)

        // Fetch requests
        const requestsRes = await fetch(`${API_URL}/api/booking-requests`, { credentials: 'include' })
        if (!requestsRes.ok) throw new Error('Failed to fetch requests')
        const requestsData = await requestsRes.json()
        setRequests(requestsData)

        // Fetch stats
        const statsRes = await fetch(`${API_URL}/api/booking-requests/stats/summary`, { credentials: 'include' })
        if (statsRes.ok) {
          setStats(await statsRes.json())
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Не удалось загрузить заявки')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredRequests = filterStatus === 'all'
    ? requests
    : requests.filter(r => r.status === filterStatus)

  const handleConfirm = async (request: BookingRequest, clientId?: number, createRental = false) => {
    setIsProcessing(true)
    try {
      const res = await fetch(`${API_URL}/api/booking-requests/${request.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ clientId, createRental }),
      })

      if (!res.ok) throw new Error('Failed to confirm')

      const updated = await res.json()
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, ...updated } : r))
      setStats(prev => ({ ...prev, pending: prev.pending - 1, confirmed: prev.confirmed + 1 }))
      setIsModalOpen(false)
      setSelectedRequest(null)
    } catch (err) {
      console.error('Error confirming:', err)
      alert('Ошибка при подтверждении заявки')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (request: BookingRequest, reason?: string) => {
    setIsProcessing(true)
    try {
      const res = await fetch(`${API_URL}/api/booking-requests/${request.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminNotes: reason }),
      })

      if (!res.ok) throw new Error('Failed to reject')

      const updated = await res.json()
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, ...updated } : r))
      setStats(prev => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }))
      setIsModalOpen(false)
      setSelectedRequest(null)
    } catch (err) {
      console.error('Error rejecting:', err)
      alert('Ошибка при отклонении заявки')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-[3px] border-gray-200 dark:border-zinc-700" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-t-gray-900 dark:border-t-white animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
          >
            Обновить
          </button>
        </div>
      </div>
    )
  }

  const statusCount = (s: 'all' | BookingRequestStatus) =>
    s === 'all' ? stats.total : (stats[s as keyof typeof stats] ?? 0)

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-end justify-between gap-4 fade-up">
        <div>
          <p className="eyebrow mb-1.5">Бронирования</p>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[var(--ink)] leading-none">Заявки с сайта</h1>
            {stats.pending > 0 && <span className="pill pill-warning"><span className="pulse-dot w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />{stats.pending} новых</span>}
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-animation">
        <BookingStat label="Ожидают" value={stats.pending} tone="amber" icon={<ClockIcon className="w-[18px] h-[18px]" />} />
        <BookingStat label="Подтверждено" value={stats.confirmed} tone="emerald" icon={<CheckIcon className="w-[18px] h-[18px]" />} />
        <BookingStat label="Отклонено" value={stats.rejected} tone="rose" icon={<XIcon className="w-[18px] h-[18px]" />} />
        <BookingStat label="Всего" value={stats.total} tone="neutral" icon={<CarIcon className="w-[18px] h-[18px]" />} />
      </div>

      {/* Filters */}
      <div className="segment overflow-x-auto max-w-full fade-up">
        {(['all', 'pending', 'confirmed', 'rejected', 'completed'] as const).map((status) => (
          <button key={status} onClick={() => setFilterStatus(status)} className={clsx('segment-item', filterStatus === status && 'is-active')}>
            {status === 'all' ? 'Все' : statusLabels[status]}
            <span className="segment-item-count">{statusCount(status)}</span>
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4 stagger-animation">
        {filteredRequests.length === 0 ? (
          <div className="card p-12 text-center fade-up">
            <span className="icon-soft icon-soft-neutral w-16 h-16 mx-auto mb-4 breathe"><InboxIcon className="w-8 h-8" /></span>
            <p className="text-[var(--ink-2)] font-medium">Заявок не найдено</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className={clsx('card card-hover overflow-hidden', request.status === 'pending' && 'stripe-l')}
              style={request.status === 'pending' ? { ['--stripe' as string]: '#f59e0b' } : undefined}
            >
              <div className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="icon-soft icon-soft-neutral w-12 h-12"><CarIcon className="w-6 h-6" /></span>
                    <div>
                      <h3 className="text-[16px] font-semibold text-[var(--ink)]">
                        {request.vehicle?.brand} {request.vehicle?.model}
                      </h3>
                      <p className="text-[12px] font-mono text-[var(--ink-subtle)]">{request.referenceCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={clsx('pill', statusPill[request.status])}>{statusLabels[request.status]}</span>
                    <span className="text-[17px] font-bold text-[var(--ink)] num-roll">{formatPrice(request.totalPrice)}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-[13px]">
                    <UserIcon className="w-4 h-4 text-[var(--ink-subtle)] shrink-0" />
                    <span className="text-[var(--ink-2)] truncate">{request.customerFirstName} {request.customerLastName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <PhoneIcon className="w-4 h-4 text-[var(--ink-subtle)] shrink-0" />
                    <a href={`tel:${request.customerPhone}`} className="text-[var(--ink)] font-medium hover:underline">{request.customerPhone}</a>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <CalendarIcon className="w-4 h-4 text-[var(--ink-subtle)] shrink-0" />
                    <span className="text-[var(--ink-2)]">{formatDate(request.startDate)} — {formatDate(request.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <MapPinIcon className="w-4 h-4 text-[var(--ink-subtle)] shrink-0" />
                    <span className="text-[var(--ink-2)] truncate">{request.pickupLocation}</span>
                  </div>
                </div>

                {/* Actions */}
                {request.status === 'pending' && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border)]">
                    <button
                      onClick={() => { setSelectedRequest(request); setIsModalOpen(true) }}
                      className="btn-primary !py-2"
                    >
                      <CheckIcon className="w-4 h-4" /> Подтвердить
                    </button>
                    <button
                      onClick={() => { if (confirm('Отклонить заявку?')) handleReject(request) }}
                      className="btn-secondary !py-2 hover:!text-red-600 hover:!border-red-200"
                    >
                      <XIcon className="w-4 h-4" /> Отклонить
                    </button>
                    <a href={`mailto:${request.customerEmail}`} className="btn-secondary !py-2">
                      <MailIcon className="w-4 h-4" /> Написать
                    </a>
                  </div>
                )}

                {/* Created at */}
                <p className="text-[11px] text-[var(--ink-subtle)] mt-3">Создано: {formatDateTime(request.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Подтвердить заявку
            </h3>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl">
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedRequest.vehicle?.brand} {selectedRequest.vehicle?.model}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(selectedRequest.startDate)} — {formatDate(selectedRequest.endDate)}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                  {formatPrice(selectedRequest.totalPrice)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Клиент</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedRequest.customerFirstName} {selectedRequest.customerLastName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{selectedRequest.customerPhone}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{selectedRequest.customerEmail}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleConfirm(selectedRequest)}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Обработка...' : 'Подтвердить'}
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedRequest(null)
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
