import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

export default function Select({ value, onChange, options, placeholder = 'Выберите...', className }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={selectRef} className={clsx('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all',
          'bg-gray-900 dark:bg-white text-white dark:text-gray-900',
          'hover:bg-gray-800 dark:hover:bg-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
        )}
      >
        <span className="flex items-center gap-2">
          {selectedOption && <CheckIcon className="w-4 h-4" />}
          <span>{selectedOption?.label || placeholder}</span>
        </span>
        <ChevronIcon className={clsx('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={clsx(
          'absolute z-50 mt-2 w-full min-w-[200px] py-2 rounded-2xl',
          'bg-white dark:bg-zinc-900',
          'border border-gray-200 dark:border-zinc-700',
          'shadow-lg shadow-black/10 dark:shadow-black/30',
          'animate-in fade-in slide-in-from-top-2 duration-200'
        )}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                option.value === value
                  ? 'text-gray-900 dark:text-white font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800'
              )}
            >
              <span className="w-4">
                {option.value === value && <CheckIcon className="w-4 h-4 text-primary-500" />}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}
