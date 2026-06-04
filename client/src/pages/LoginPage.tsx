import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const { login, isAuthenticated, failedAttempts } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password) {
      setError('Введите логин и пароль')
      return
    }

    setIsLoading(true)
    setError('')

    const success = await login(username.trim(), password)

    if (success) {
      navigate('/dashboard', { replace: true })
    } else {
      setError('Неверный логин или пароль')
      setShake(true)
      setTimeout(() => {
        setShake(false)
      }, 500)
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="glass absolute top-6 right-6 w-11 h-11 rounded-full flex items-center justify-center text-[var(--ink)] transition-all hover:scale-105 active:scale-95"
        aria-label="Сменить тему"
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-sm fade-up">
        {/* Logo */}
        <div className="text-center mb-9">
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center text-[28px] font-bold"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f5f4f0 100%)',
              color: '#0a0a0a',
              boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 0 0 1px var(--border), 0 10px 30px -10px rgba(245, 158, 11, 0.35)',
            }}
          >
            U
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-[var(--ink)]">UNICAR</h1>
          <p className="text-[13px] text-[var(--ink-muted)] mt-1">Система управления автопарком</p>
        </div>

        {/* Login form card */}
        <div className="surface p-7 shadow-soft">
          <form
            onSubmit={handleSubmit}
            className={`space-y-5 ${shake ? 'animate-shake' : ''}`}
          >
            {/* Username field */}
            <div>
              <label htmlFor="username" className="form-label">Логин</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError('')
                }}
                disabled={isLoading}
                autoFocus
                autoComplete="username"
                className="input"
                placeholder="Введите логин"
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="form-label">Пароль</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="input pr-11"
                  placeholder="Введите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error / attempts message */}
            <div className="h-5 text-center">
              {error && <span className="text-[13px] text-red-500 font-medium">{error}</span>}
              {!error && failedAttempts > 0 && failedAttempts < 5 && (
                <span className="text-[13px] font-medium" style={{ color: 'var(--accent)' }}>
                  Осталось попыток: {5 - failedAttempts}
                </span>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full !py-3 !rounded-xl"
            >
              {isLoading ? (
                <>
                  <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900 rounded-full animate-spin" />
                  <span>Вход…</span>
                </>
              ) : (
                'Войти'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}
