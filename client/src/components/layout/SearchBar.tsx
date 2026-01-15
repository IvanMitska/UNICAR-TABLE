import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

interface SearchResult {
  id: number
  type: 'vehicle' | 'client' | 'rental'
  title: string
  subtitle: string
  href: string
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const showDropdown = isFocused && (query.length > 0 || results.length > 0)

  // Update dropdown position
  useEffect(() => {
    if (showDropdown && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      })
    }
  }, [showDropdown, query])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      navigate(results[selectedIndex].href)
      setQuery('')
      setResults([])
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setQuery('')
      setResults([])
      inputRef.current?.blur()
    }
  }

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true)
      try {
        const searchResults: SearchResult[] = []

        const [vehiclesRes, clientsRes, rentalsRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/clients'),
          fetch('/api/rentals')
        ])

        if (vehiclesRes.ok) {
          const vehicles = await vehiclesRes.json()
          vehicles
            .filter((v: any) =>
              `${v.brand} ${v.model} ${v.licensePlate}`.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 3)
            .forEach((v: any) => {
              searchResults.push({
                id: v.id,
                type: 'vehicle',
                title: `${v.brand} ${v.model}`,
                subtitle: v.licensePlate,
                href: `/vehicles?id=${v.id}`
              })
            })
        }

        if (clientsRes.ok) {
          const clients = await clientsRes.json()
          clients
            .filter((c: any) =>
              `${c.fullName} ${c.phone}`.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 3)
            .forEach((c: any) => {
              searchResults.push({
                id: c.id,
                type: 'client',
                title: c.fullName,
                subtitle: c.phone,
                href: `/clients?id=${c.id}`
              })
            })
        }

        if (rentalsRes.ok) {
          const rentals = await rentalsRes.json()
          rentals
            .filter((r: any) =>
              `${r.vehicle?.brand} ${r.vehicle?.model} ${r.client?.fullName}`.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 3)
            .forEach((r: any) => {
              searchResults.push({
                id: r.id,
                type: 'rental',
                title: `${r.vehicle?.brand} ${r.vehicle?.model}`,
                subtitle: r.client?.fullName || 'Аренда',
                href: `/rentals?id=${r.id}`
              })
            })
        }

        setResults(searchResults)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  return (
    <>
      <div ref={containerRef} className="flex-1 max-w-xl relative">
        <div className="relative group">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300 transition-colors pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Поиск по системе..."
            className="w-full h-11 pl-11 pr-16 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 focus:border-gray-300 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-all"
          />
          <kbd className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: Math.max(dropdownPosition.width, 300),
            zIndex: 99999
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-600 dark:border-t-zinc-300 rounded-full animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    navigate(result.href)
                    setQuery('')
                    setResults([])
                    setIsFocused(false)
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-gray-100 dark:bg-zinc-800'
                      : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                  )}
                >
                  <div className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    result.type === 'vehicle' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                    result.type === 'client' && 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                    result.type === 'rental' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  )}>
                    {result.type === 'vehicle' && <CarIcon className="w-4 h-4" />}
                    {result.type === 'client' && <UserIcon className="w-4 h-4" />}
                    {result.type === 'rental' && <KeyIcon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {result.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {result.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Ничего не найдено
            </div>
          ) : null}
        </div>,
        document.body
      )}
    </>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  )
}
