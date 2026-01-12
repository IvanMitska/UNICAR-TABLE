import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'

interface SelectOption {
  value: string
  label: string
}

interface SelectDropdownProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  label?: string
  required?: boolean
}

export default function SelectDropdown({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  className,
  label,
  required
}: SelectDropdownProps) {
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
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm transition-all text-left',
          'bg-white dark:bg-zinc-800',
          'border border-gray-300 dark:border-zinc-600',
          'hover:border-gray-400 dark:hover:border-zinc-500',
          'focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-zinc-700 focus:border-gray-500',
          isOpen && 'border-gray-500 dark:border-zinc-400 ring-2 ring-gray-200 dark:ring-zinc-700'
        )}
      >
        <span className={selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronIcon className={clsx('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={clsx(
            'absolute left-0 z-[9999] mt-2 min-w-full py-2 rounded-2xl max-h-60 overflow-y-auto',
            'bg-white dark:bg-zinc-900',
            'border border-gray-200 dark:border-zinc-700',
            'shadow-xl shadow-black/15 dark:shadow-black/40'
          )}
          style={{ minWidth: '200px' }}
        >
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">Нет опций</div>
          ) : (
            options.map((option) => (
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
                    ? 'text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-zinc-800'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800'
                )}
              >
                <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                  {option.value === value && <CheckIcon className="w-4 h-4 text-gray-900 dark:text-white" />}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            ))
          )}
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
