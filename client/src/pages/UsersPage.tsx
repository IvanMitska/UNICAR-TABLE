import { useState, useEffect, FormEvent } from 'react'
import { useAuth, UserRole } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

interface User {
  id: number
  username: string
  fullName: string
  role: UserRole
  isActive: boolean
  createdAt: string
  lastLogin: string | null
}

interface UserFormData {
  username: string
  password: string
  fullName: string
  role: UserRole
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Администратор',
  agent: 'Агент',
}

const roleColors: Record<UserRole, string> = {
  admin: 'badge-primary',
  agent: 'badge-success',
}

export default function UsersPage() {
  const { isAdmin, user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard')
      return
    }
    fetchUsers()
  }, [isAdmin, navigate])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (data: UserFormData) => {
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      const body = editingUser
        ? { fullName: data.fullName, role: data.role, password: data.password || undefined }
        : data

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (response.ok) {
        fetchUsers()
        setIsModalOpen(false)
        setEditingUser(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка сохранения')
      }
    } catch (error) {
      console.error('Failed to save user:', error)
    }
  }

  const handleToggleActive = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('Вы не можете деактивировать свой аккаунт')
      return
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !user.isActive }),
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error)
    }
  }

  const handleResetPassword = async (newPassword: string) => {
    if (!resetPasswordUserId) return

    try {
      const response = await fetch(`/api/users/${resetPasswordUserId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword }),
      })

      if (response.ok) {
        setIsResetPasswordModalOpen(false)
        setResetPasswordUserId(null)
        alert('Пароль успешно изменён')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка смены пароля')
      }
    } catch (error) {
      console.error('Failed to reset password:', error)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      search === '' ||
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase())

    return matchesSearch
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Никогда'
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Пользователи</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Управление пользователями системы
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null)
            setIsModalOpen(true)
          }}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Добавить пользователя
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Поиск по имени или логину..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner w-8 h-8" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {search ? 'Пользователи не найдены' : 'Нет пользователей'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Имя</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Логин</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Роль</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Статус</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Последний вход</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={clsx(
                    'border-b border-gray-100 dark:border-zinc-800 last:border-0',
                    !user.isActive && 'opacity-50'
                  )}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {user.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.fullName}
                          {user.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-gray-400">(вы)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                    {user.username}
                  </td>
                  <td className="py-3 px-4">
                    <span className={clsx('badge', roleColors[user.role])}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={clsx('badge', user.isActive ? 'badge-success' : 'badge-danger')}>
                      {user.isActive ? 'Активен' : 'Отключён'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user)
                          setIsModalOpen(true)
                        }}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                        title="Редактировать"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setResetPasswordUserId(user.id)
                          setIsResetPasswordModalOpen(true)
                        }}
                        className="p-2 text-gray-400 hover:text-amber-500 transition-colors"
                        title="Сбросить пароль"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={clsx(
                            'p-2 transition-colors',
                            user.isActive
                              ? 'text-gray-400 hover:text-red-500'
                              : 'text-gray-400 hover:text-green-500'
                          )}
                          title={user.isActive ? 'Отключить' : 'Активировать'}
                        >
                          {user.isActive ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Form Modal */}
      {isModalOpen && (
        <UserFormModal
          user={editingUser}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false)
            setEditingUser(null)
          }}
        />
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && (
        <ResetPasswordModal
          onSave={handleResetPassword}
          onClose={() => {
            setIsResetPasswordModalOpen(false)
            setResetPasswordUserId(null)
          }}
        />
      )}
    </div>
  )
}

function UserFormModal({
  user,
  onSave,
  onClose,
}: {
  user: User | null
  onSave: (data: UserFormData) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<UserFormData>({
    username: user?.username || '',
    password: '',
    fullName: user?.fullName || '',
    role: user?.role || 'agent',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!user && !formData.password) {
      alert('Введите пароль для нового пользователя')
      return
    }

    if (!user && formData.password.length < 6) {
      alert('Пароль должен быть не менее 6 символов')
      return
    }

    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user ? 'Редактирование пользователя' : 'Новый пользователь'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Логин *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input w-full"
                required
                placeholder="username"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Полное имя *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="input w-full"
              required
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {user ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input w-full"
              required={!user}
              placeholder="Минимум 6 символов"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Роль *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="input w-full"
            >
              <option value="agent">Агент</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {user ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResetPasswordModal({
  onSave,
  onClose,
}: {
  onSave: (newPassword: string) => void
  onClose: () => void
}) {
  const [newPassword, setNewPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      alert('Пароль должен быть не менее 6 символов')
      return
    }

    onSave(newPassword)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Сброс пароля
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Новый пароль *
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input w-full"
              required
              placeholder="Минимум 6 символов"
              minLength={6}
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Сбросить
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
