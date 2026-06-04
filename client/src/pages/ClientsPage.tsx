import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Client, ClientStatus, ClientFormData, Rental } from '@/types'
import clsx from 'clsx'
import SelectDropdown from '@/components/ui/SelectDropdown'
import DatePicker from '@/components/ui/DatePicker'
import { CountUp } from '@/components/ui/CountUp'
import {
  User, UserRound, Phone, FileText, Check, Plus, Users, X, Search,
  CheckCircle2, Ban, SquarePen, Trash2, Mail, IdCard, History, Car,
} from 'lucide-react'

const statusPill: Record<ClientStatus, string> = {
  active: 'pill-success',
  blacklisted: 'pill-danger',
}

// License expiry warning (≤30 days or expired)
function licenseWarn(dateStr: string | null | undefined): { label: string; expired: boolean } | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (days < 0) return { label: 'ВУ истекло', expired: true }
  if (days <= 30) return { label: `ВУ: ${days} дн.`, expired: false }
  return null
}

const statusLabels: Record<ClientStatus, string> = {
  active: 'Активен',
  blacklisted: 'Чёрный список',
}

const statusColors: Record<ClientStatus, string> = {
  active: 'badge-success',
  blacklisted: 'badge-danger',
}

export default function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [viewingClient, setViewingClient] = useState<Client | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (data: ClientFormData) => {
    try {
      const url = editingClient
        ? `/api/clients/${editingClient.id}`
        : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        fetchClients()
        setIsModalOpen(false)
        setEditingClient(null)
      }
    } catch (error) {
      console.error('Failed to save client:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого клиента?')) return

    try {
      const response = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchClients()
      }
    } catch (error) {
      console.error('Failed to delete client:', error)
    }
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      search === '' ||
      client.fullName.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search)

    const matchesStatus =
      statusFilter === 'all' || client.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Stats
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    blacklisted: clients.filter(c => c.status === 'blacklisted').length,
  }

  const statusCount = (s: ClientStatus | 'all') =>
    s === 'all' ? clients.length : clients.filter(c => c.status === s).length

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-[112px] rounded-[18px] skeleton" />)}
        </div>
        <div className="h-11 rounded-xl skeleton" />
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-[76px] rounded-2xl skeleton" />)}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 fade-up">
        <div>
          <p className="eyebrow mb-1.5">База данных</p>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[var(--ink)] leading-none">Клиенты</h1>
            <span className="pill pill-neutral">{clients.length}</span>
          </div>
        </div>
        <button onClick={() => { setEditingClient(null); setIsModalOpen(true) }} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Добавить клиента
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 stagger-animation">
        <ClientStat label="Всего" value={stats.total} tone="neutral" icon={<Users className="w-[18px] h-[18px]" />} />
        <ClientStat label="Активных" value={stats.active} tone="emerald" icon={<CheckCircle2 className="w-[18px] h-[18px]" />} />
        <ClientStat label="В ЧС" value={stats.blacklisted} tone="rose" icon={<Ban className="w-[18px] h-[18px]" />} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 fade-up">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--ink-subtle)]" />
          <input
            type="text"
            placeholder="Поиск по имени или телефону…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input !pl-11"
          />
        </div>
        <div className="segment">
          {(['all', 'active', 'blacklisted'] as const).map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={clsx('segment-item', statusFilter === status && 'is-active')}>
              {status === 'all' ? 'Все' : statusLabels[status]}
              <span className="segment-item-count">{statusCount(status)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clients list */}
      {filteredClients.length === 0 ? (
        <div className="card p-12 text-center fade-up">
          <span className="icon-soft icon-soft-neutral w-16 h-16 mx-auto mb-4 breathe"><Users className="w-8 h-8" /></span>
          <p className="text-[var(--ink-2)] font-medium">
            {clients.length === 0 ? 'Клиентов пока нет' : 'Клиенты не найдены'}
          </p>
          <p className="text-[13px] text-[var(--ink-subtle)] mt-1">
            {clients.length === 0 ? 'Добавьте первого клиента, нажав кнопку выше' : 'Попробуйте изменить критерии поиска'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger-animation">
          {filteredClients.map((client) => {
            const warn = licenseWarn(client.licenseExpiry)
            return (
              <div
                key={client.id}
                onClick={() => setViewingClient(client)}
                className="card card-hover p-4 cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={clsx('avatar-soft w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg', client.status === 'blacklisted' ? 'avatar-tint-5' : 'avatar-tint-3')}>
                      {client.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[var(--ink)] truncate">{client.fullName}</h3>
                      <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--ink-muted)] mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-[var(--ink-subtle)]" />
                        <span>{client.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* License */}
                  <div className="flex items-center gap-2">
                    <span className="icon-soft icon-soft-neutral w-9 h-9"><IdCard className="w-[18px] h-[18px]" /></span>
                    <div>
                      <p className="font-mono text-[13px] text-[var(--ink-2)]">{client.licenseNumber || '—'}</p>
                      <p className="text-[11px] text-[var(--ink-subtle)]">
                        {client.licenseExpiry ? `до ${new Date(client.licenseExpiry).toLocaleDateString('ru-RU')}` : 'нет данных'}
                      </p>
                    </div>
                    {warn && (
                      <span className={clsx('pill ml-1', warn.expired ? 'pill-danger' : 'pill-warning')}>{warn.label}</span>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 sm:ml-auto">
                    <span className={clsx('pill', statusPill[client.status])}>{statusLabels[client.status]}</span>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setEditingClient(client); setIsModalOpen(true) }} className="btn-icon !w-8 !h-8" title="Изменить">
                        <SquarePen className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="btn-icon !w-8 !h-8 hover:!text-red-600 hover:!border-red-200" title="Удалить">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <ClientModal
          client={editingClient}
          onClose={() => {
            setIsModalOpen(false)
            setEditingClient(null)
          }}
          onSave={handleSave}
        />
      )}

      {/* View Modal */}
      {viewingClient && (
        <ClientDetailModal
          client={viewingClient}
          onClose={() => setViewingClient(null)}
          onEdit={() => {
            setEditingClient(viewingClient)
            setIsModalOpen(true)
            setViewingClient(null)
          }}
        />
      )}
    </div>
  )
}

function ClientStat({ label, value, tone, icon }: {
  label: string; value: number; tone: 'neutral' | 'emerald' | 'rose'; icon: React.ReactNode
}) {
  return (
    <div className="stat-card card-hover">
      <span className={clsx('icon-soft w-9 h-9 mb-2.5', `icon-soft-${tone}`)}>{icon}</span>
      <p className="eyebrow mb-1">{label}</p>
      <p className="text-[24px] sm:text-[26px] leading-none font-bold tracking-tight text-[var(--ink)]"><CountUp value={value} /></p>
    </div>
  )
}

function ClientModal({
  client,
  onClose,
  onSave,
}: {
  client: Client | null
  onClose: () => void
  onSave: (data: ClientFormData) => void
}) {
  const [formData, setFormData] = useState<ClientFormData>({
    fullName: client?.fullName ?? '',
    phone: client?.phone ?? '',
    phoneAlt: client?.phoneAlt ?? '',
    email: client?.email ?? '',
    passport: client?.passport ?? '',
    licenseNumber: client?.licenseNumber ?? '',
    licenseExpiry: client?.licenseExpiry ?? '',
    birthDate: client?.birthDate ?? '',
    address: client?.address ?? '',
    status: client?.status ?? 'active',
    notes: client?.notes ?? '',
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
                <UserIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {client ? 'Редактирование' : 'Новый клиент'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {client ? client.fullName : 'Заполните данные клиента'}
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
            {/* Personal Info Section */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500">
                  <PersonIcon className="w-full h-full" />
                </span>
                Личные данные
              </div>
              <div className="space-y-4">
                <div>
                  <label className="form-label required">ФИО</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input-enhanced"
                    placeholder="Иванов Иван Иванович"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <DatePicker
                    label="Дата рождения"
                    value={formData.birthDate}
                    onChange={(value) => setFormData({ ...formData, birthDate: value })}
                  />
                  <SelectDropdown
                    label="Статус"
                    value={formData.status}
                    onChange={(value) => setFormData({ ...formData, status: value as ClientStatus })}
                    options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
                  />
                </div>
              </div>
            </div>

            {/* Contacts Section */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500">
                  <PhoneIcon className="w-full h-full" />
                </span>
                Контактные данные
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label required">Телефон</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-enhanced"
                    placeholder="+66 XX XXX XXXX"
                  />
                </div>
                <div>
                  <label className="form-label">Доп. телефон</label>
                  <input
                    type="tel"
                    value={formData.phoneAlt}
                    onChange={(e) => setFormData({ ...formData, phoneAlt: e.target.value })}
                    className="input-enhanced"
                    placeholder="+66 XX XXX XXXX"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-enhanced"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label required">Адрес проживания</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-enhanced"
                    placeholder="Адрес проживания"
                  />
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="form-section">
              <div className="form-section-title">
                <span className="form-section-icon bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-500">
                  <DocumentIcon className="w-full h-full" />
                </span>
                Документы
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="form-label required">Номер паспорта</label>
                  <input
                    type="text"
                    required
                    value={formData.passport}
                    onChange={(e) => setFormData({ ...formData, passport: e.target.value })}
                    className="input-enhanced font-mono tracking-wider"
                    placeholder="Серия и номер паспорта"
                  />
                </div>
                <div>
                  <label className="form-label required">Номер ВУ</label>
                  <input
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="input-enhanced font-mono tracking-wider"
                    placeholder="Номер прав"
                  />
                </div>
                <DatePicker
                  label="ВУ действительно до"
                  value={formData.licenseExpiry}
                  onChange={(value) => setFormData({ ...formData, licenseExpiry: value })}
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
                placeholder="Дополнительная информация о клиенте..."
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
              {client ? 'Сохранить изменения' : 'Добавить клиента'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClientDetailModal({
  client,
  onClose,
  onEdit,
}: {
  client: Client
  onClose: () => void
  onEdit: () => void
}) {
  const [rentals, setRentals] = useState<Rental[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchClientRentals()
  }, [client.id])

  const fetchClientRentals = async () => {
    try {
      const response = await fetch('/api/rentals')
      if (response.ok) {
        const data = await response.json()
        // Filter rentals for this client
        const clientRentals = data.filter((r: Rental) => r.client?.id === client.id)
        setRentals(clientRentals)
      }
    } catch (error) {
      console.error('Failed to fetch rentals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const rentalStatusLabels: Record<string, string> = {
    active: 'Активна',
    completed: 'Завершена',
    cancelled: 'Отменена',
  }

  const rentalStatusColors: Record<string, string> = {
    active: 'badge-success',
    completed: 'badge-gray',
    cancelled: 'badge-danger',
  }

  // Stats
  const totalRentals = rentals.length
  const activeRentals = rentals.filter(r => r.status === 'active').length
  const totalSpent = rentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-overlay" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="modal-content relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 font-bold text-2xl">
                  {client.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {client.fullName}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <PhoneIcon className="w-3.5 h-3.5" />
                    {client.phone}
                  </span>
                  {client.email && (
                    <span className="flex items-center gap-1">
                      <EmailIcon className="w-3.5 h-3.5" />
                      {client.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <EditIcon className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {/* Client Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Статус</p>
                <span className={clsx('badge', statusColors[client.status])}>
                  {statusLabels[client.status]}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Всего аренд</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalRentals}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Активных</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{activeRentals}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Потрачено</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(totalSpent)}</p>
              </div>
            </div>

            {/* Documents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 flex items-center justify-center">
                    <DocumentIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Паспорт</p>
                    <p className="font-mono text-gray-900 dark:text-white">{client.passport}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 flex items-center justify-center">
                    <LicenseIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">ВУ до {formatDate(client.licenseExpiry)}</p>
                    <p className="font-mono text-gray-900 dark:text-white">{client.licenseNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rental History */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-gray-400" />
                История аренд
              </h3>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full animate-spin" />
                </div>
              ) : rentals.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                  <CarIcon className="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Нет истории аренд</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rentals.map((rental) => (
                    <div
                      key={rental.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 flex items-center justify-center">
                          <CarIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {rental.vehicle?.brand} {rental.vehicle?.model}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(rental.startDate)} — {formatDate(rental.plannedEndDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(rental.totalAmount || 0)}
                        </p>
                        <span className={clsx('badge', rentalStatusColors[rental.status])}>
                          {rentalStatusLabels[rental.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            {client.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Заметки</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                  {client.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
            <button onClick={onClose} className="w-full btn btn-secondary py-3">
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===================== Icons (lucide) ===================== */
function UserIcon({ className }: { className?: string }) { return <User className={className} /> }
function PersonIcon({ className }: { className?: string }) { return <UserRound className={className} /> }
function PhoneIcon({ className }: { className?: string }) { return <Phone className={className} /> }
function DocumentIcon({ className }: { className?: string }) { return <FileText className={className} /> }
function CheckIcon({ className }: { className?: string }) { return <Check className={className} /> }
function PlusIcon({ className }: { className?: string }) { return <Plus className={className} /> }
function CloseIcon({ className }: { className?: string }) { return <X className={className} /> }
function SearchIcon({ className }: { className?: string }) { return <Search className={className} /> }
function EditIcon({ className }: { className?: string }) { return <SquarePen className={className} /> }
function EmailIcon({ className }: { className?: string }) { return <Mail className={className} /> }
function LicenseIcon({ className }: { className?: string }) { return <IdCard className={className} /> }
function HistoryIcon({ className }: { className?: string }) { return <History className={className} /> }
function CarIcon({ className }: { className?: string }) { return <Car className={className} /> }
