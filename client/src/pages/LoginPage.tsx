import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

const PIN_LENGTH = 4

export default function LoginPage() {
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const { login, isAuthenticated, isBlocked, blockEndTime, failedAttempts } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [remainingTime, setRemainingTime] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (isBlocked && blockEndTime) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((blockEndTime - Date.now()) / 1000))
        setRemainingTime(remaining)
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [isBlocked, blockEndTime])

  // Auto-submit when PIN is complete
  useEffect(() => {
    const pinString = pin.join('')
    if (pinString.length === PIN_LENGTH && !isLoading && !isBlocked) {
      handleSubmit(pinString)
    }
  }, [pin])

  const handleSubmit = async (pinString: string) => {
    setIsLoading(true)
    setError('')

    const success = await login(pinString)

    if (success) {
      navigate('/dashboard', { replace: true })
    } else {
      setError('Неверный PIN')
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setPin(Array(PIN_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      }, 500)
    }

    setIsLoading(false)
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value.slice(-1)
    setPin(newPin)
    setError('')

    // Move to next input
    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH)
    if (pastedData) {
      const newPin = Array(PIN_LENGTH).fill('')
      pastedData.split('').forEach((char, i) => {
        newPin[i] = char
      })
      setPin(newPin)
      inputRefs.current[Math.min(pastedData.length, PIN_LENGTH - 1)]?.focus()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-zinc-950">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="text-center mb-16">
          <img
            src="/unicar-logo.png"
            alt="UNICAR"
            className="h-24 mx-auto object-contain"
          />
        </div>

        {/* PIN inputs */}
        <div
          className={`flex justify-center gap-3 mb-8 ${shake ? 'animate-shake' : ''}`}
          onPaste={handlePaste}
        >
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isBlocked || isLoading}
              autoFocus={index === 0}
              className={`
                w-14 h-14 text-center text-2xl font-medium rounded-xl
                bg-white dark:bg-zinc-900
                border-2 transition-all duration-200 outline-none
                ${digit
                  ? 'border-primary'
                  : 'border-gray-200 dark:border-zinc-700'
                }
                ${error
                  ? 'border-red-400 dark:border-red-500'
                  : ''
                }
                focus:border-primary focus:ring-4 focus:ring-primary/10
                disabled:opacity-50 disabled:cursor-not-allowed
                text-gray-900 dark:text-white
              `}
            />
          ))}
        </div>

        {/* Status messages */}
        <div className="h-6 mb-6 text-center text-sm">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <div className="spinner w-4 h-4" />
            </div>
          )}
          {error && !isLoading && (
            <span className="text-red-500">{error}</span>
          )}
          {isBlocked && (
            <span className="text-red-500">Заблокировано: {formatTime(remainingTime)}</span>
          )}
          {!isBlocked && !error && !isLoading && failedAttempts > 0 && (
            <span className="text-amber-500">Попыток: {5 - failedAttempts}</span>
          )}
        </div>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  )
}
