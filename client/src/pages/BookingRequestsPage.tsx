import { useState, useEffect } from 'react'
import type { BookingRequest, BookingRequestStatus } from '@/types'
import clsx from 'clsx'

const API_URL = ''

const statusLabels: Record<BookingRequestStatus, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  rejected: 'Отклонено',
  completed: 'Завершено',
}

const statusColors: Record<BookingRequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400',
}

// Icons
const ClockIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const CarIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
)

const CalendarIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const UserIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const PhoneIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

const MailIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const MapPinIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

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

        // Fetch clients for confirm modal
        const clientsRes = await fetch(`${API_URL}/api/clients`, { credentials: 'include' })
        if (clientsRes.ok) {
          setClients(await clientsRes.json())
        }

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Обновить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
            Заявки с сайта
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Управление заявками на бронирование
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-800/50 flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500">Ожидают</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-800/50 flex items-center justify-center">
              <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-green-700 dark:text-green-400">{stats.confirmed}</p>
              <p className="text-xs text-green-600 dark:text-green-500">Подтверждено</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-800/50 flex items-center justify-center">
              <XIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-red-700 dark:text-red-400">{stats.rejected}</p>
              <p className="text-xs text-red-600 dark:text-red-500">Отклонено</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
              <CarIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300">{stats.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Всего</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'confirmed', 'rejected', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filterStatus === status
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {status === 'all' ? 'Все' : statusLabels[status]}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Заявок не найдено</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden"
            >
              <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <CarIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {request.vehicle?.brand} {request.vehicle?.model}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {request.referenceCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      statusColors[request.status]
                    )}>
                      {statusLabels[request.status]}
                    </span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(request.totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {request.customerFirstName} {request.customerLastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${request.customerPhone}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                      {request.customerPhone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {formatDate(request.startDate)} — {formatDate(request.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {request.pickupLocation}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {request.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                    <button
                      onClick={() => {
                        setSelectedRequest(request)
                        setIsModalOpen(true)
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Подтвердить
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Отклонить заявку?')) {
                          handleReject(request)
                        }
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <XIcon className="w-4 h-4" />
                      Отклонить
                    </button>
                    <a
                      href={`mailto:${request.customerEmail}`}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <MailIcon className="w-4 h-4" />
                      Написать
                    </a>
                  </div>
                )}

                {/* Created at */}
                <p className="text-xs text-gray-400 mt-3">
                  Создано: {formatDateTime(request.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Подтвердить заявку
            </h3>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedRequest.vehicle?.brand} {selectedRequest.vehicle?.model}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(selectedRequest.startDate)} — {formatDate(selectedRequest.endDate)}
                </p>
                <p className="text-lg font-semibold text-primary-600 dark:text-primary-400 mt-2">
                  {formatPrice(selectedRequest.totalPrice)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
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
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
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
