import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Client, ClientStatus, ClientFormData } from '@/types'
import clsx from 'clsx'
import SelectDropdown from '@/components/ui/SelectDropdown'
import DatePicker from '@/components/ui/DatePicker'

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Клиенты</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            База клиентов: {stats.total} записей
          </p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null)
            setIsModalOpen(true)
          }}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Добавить клиента
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '0ms' }}>
          <span className="text-gray-400 dark:text-gray-500 mb-2">
            <UsersIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.total}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">Всего</p>
        </div>
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '50ms' }}>
          <span className="text-gray-400 dark:text-gray-500 mb-2">
            <CheckCircleIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.active}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">Активных</p>
        </div>
        <div className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
          <span className="text-gray-400 dark:text-gray-500 mb-2">
            <BanIcon className="w-5 h-5" />
          </span>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stats.blacklisted}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-1">В ЧС</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: '150ms' }}>
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по имени или телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-enhanced pl-12"
          />
        </div>
        <div className="w-full sm:w-48">
          <SelectDropdown
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as ClientStatus | 'all')}
            options={[
              { value: 'all', label: 'Все статусы' },
              ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))
            ]}
            placeholder="Статус"
          />
        </div>
      </div>

      {/* Clients list */}
      {filteredClients.length === 0 ? (
        <div className="p-12 text-center animate-slide-up rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm" style={{ animationDelay: '200ms' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
            <UsersIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {clients.length === 0 ? 'Клиентов пока нет' : 'Клиенты не найдены'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {clients.length === 0 ? 'Добавьте первого клиента, нажав кнопку выше' : 'Попробуйте изменить критерии поиска'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {filteredClients.map((client, index) => (
            <div
              key={client.id}
              className="p-4 animate-slide-up rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm"
              style={{ animationDelay: `${200 + index * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar & Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold text-lg">
                      {client.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {client.fullName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <PhoneIcon className="w-3.5 h-3.5" />
                      <span>{client.phone}</span>
                    </div>
                  </div>
                </div>

                {/* License */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                      <DocumentIcon className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-mono text-gray-900 dark:text-white">{client.licenseNumber}</p>
                        <p className="text-xs text-gray-400">до {new Date(client.licenseExpiry).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3">
                  <span className={clsx('badge', statusColors[client.status])}>
                    {statusLabels[client.status]}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingClient(client)
                        setIsModalOpen(true)
                      }}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
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

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
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

function BanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
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
