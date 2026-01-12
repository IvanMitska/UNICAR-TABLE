import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (pinForm.newPin !== pinForm.confirmPin) {
      setMessage({ type: 'error', text: 'PIN-коды не совпадают' })
      return
    }

    if (pinForm.newPin.length < 4 || pinForm.newPin.length > 6) {
      setMessage({ type: 'error', text: 'PIN должен быть 4-6 цифр' })
      return
    }

    try {
      const response = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPin: pinForm.currentPin,
          newPin: pinForm.newPin,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'PIN успешно изменён' })
        setPinForm({ currentPin: '', newPin: '', confirmPin: '' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Ошибка смены PIN' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Ошибка смены PIN' })
    }
  }

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/backup')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `unicar-backup-${new Date().toISOString().split('T')[0]}.sqlite`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      }
    } catch (error) {
      console.error('Failed to create backup:', error)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки</h1>

      {/* Theme */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Внешний вид</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Тема
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                theme === 'light'
                  ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <SunIcon className="w-5 h-5" />
              Светлая
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                theme === 'dark'
                  ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <MoonIcon className="w-5 h-5" />
              Тёмная
            </button>
          </div>
        </div>
      </div>

      {/* Change PIN */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Безопасность</h2>
        <form onSubmit={handlePinChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Текущий PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pinForm.currentPin}
              onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value.replace(/\D/g, '') })}
              className="input-enhanced max-w-xs"
              placeholder="Введите текущий PIN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Новый PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pinForm.newPin}
              onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })}
              className="input-enhanced max-w-xs"
              placeholder="4-6 цифр"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Подтвердите PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pinForm.confirmPin}
              onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
              className="input-enhanced max-w-xs"
              placeholder="Повторите новый PIN"
            />
          </div>

          {message && (
            <div className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary">
            Изменить PIN
          </button>
        </form>
      </div>

      {/* Backup */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Данные</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Скачайте резервную копию базы данных. Храните файл в надёжном месте.
        </p>
        <button onClick={handleBackup} className="btn btn-secondary">
          <DownloadIcon className="w-5 h-5 mr-2" />
          Скачать бэкап
        </button>
      </div>

      {/* About */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">О программе</h2>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>UNICAR</strong> — Система учёта аренды ТС</p>
          <p>Версия 1.0.0</p>
        </div>
      </div>
    </div>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}
