import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Vehicle, Rental, Client } from '@/types'
import clsx from 'clsx'
import {
  Search, CornerDownLeft, Home, KeyRound, CalendarDays, Car, Users, Inbox,
  Wrench, BarChart3, Bell, Settings, Plus, UserPlus, ReceiptText, CircleDollarSign,
} from 'lucide-react'

interface Cmd {
  id: string
  group: string
  icon: React.FC<{ className?: string }>
  title: string
  sub?: string
  run: () => void
}

export default function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const [data, setData] = useState<{ vehicles: Vehicle[]; clients: Client[]; rentals: Rental[] }>({ vehicles: [], clients: [], rentals: [] })
  const loaded = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = useCallback(() => { setOpen(false); setQ(''); setSel(0) }, [])

  // global hotkey ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setOpen(o => !o)
      } else if (e.key === 'Escape') { setOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // lazy-load entities on first open
  useEffect(() => {
    if (!open) return
    setSel(0)
    setTimeout(() => inputRef.current?.focus(), 30)
    if (loaded.current) return
    loaded.current = true
    Promise.all([fetch('/api/vehicles'), fetch('/api/clients'), fetch('/api/rentals')])
      .then(async ([v, c, r]) => setData({
        vehicles: v.ok ? await v.json() : [], clients: c.ok ? await c.json() : [], rentals: r.ok ? await r.json() : [],
      })).catch(() => {})
  }, [open])

  const go = (path: string) => { navigate(path); close() }

  const nav: Cmd[] = [
    { id: 'n-dash', group: 'Навигация', icon: Home, title: 'Дашборд', run: () => go('/dashboard') },
    { id: 'n-rent', group: 'Навигация', icon: KeyRound, title: 'Аренды', run: () => go('/rentals') },
    { id: 'n-cal', group: 'Навигация', icon: CalendarDays, title: 'Календарь', run: () => go('/calendar') },
    { id: 'n-veh', group: 'Навигация', icon: Car, title: 'Автомобили', run: () => go('/vehicles') },
    { id: 'n-cli', group: 'Навигация', icon: Users, title: 'Клиенты', run: () => go('/clients') },
    { id: 'n-book', group: 'Навигация', icon: Inbox, title: 'Заявки', run: () => go('/booking-requests') },
    { id: 'n-mnt', group: 'Навигация', icon: Wrench, title: 'Обслуживание', run: () => go('/maintenance') },
    { id: 'n-fin', group: 'Навигация', icon: BarChart3, title: 'Финансы', run: () => go('/finances') },
    { id: 'n-alr', group: 'Навигация', icon: Bell, title: 'Уведомления', run: () => go('/alerts') },
    { id: 'n-set', group: 'Навигация', icon: Settings, title: 'Настройки', run: () => go('/settings') },
  ]
  const actions: Cmd[] = [
    { id: 'a-rent', group: 'Действия', icon: Plus, title: 'Новая аренда', run: () => go('/rentals?action=new') },
    { id: 'a-cli', group: 'Действия', icon: UserPlus, title: 'Новый клиент', run: () => go('/clients?action=new') },
    { id: 'a-veh', group: 'Действия', icon: Car, title: 'Добавить авто', run: () => go('/vehicles?action=new') },
    { id: 'a-exp', group: 'Действия', icon: ReceiptText, title: 'Добавить расход', run: () => go('/finances') },
  ]

  const ql = q.trim().toLowerCase()
  const match = (s: string) => s.toLowerCase().includes(ql)

  let results: Cmd[] = []
  if (ql === '') {
    results = [...actions, ...nav]
  } else {
    results = [...nav.filter(c => match(c.title)), ...actions.filter(c => match(c.title))]
    data.vehicles.filter(v => match(`${v.brand} ${v.model} ${v.licensePlate}`)).slice(0, 6).forEach(v =>
      results.push({ id: `v${v.id}`, group: 'Автомобили', icon: Car, title: `${v.brand} ${v.model}`, sub: v.licensePlate, run: () => go('/vehicles') }))
    data.clients.filter(c => match(`${c.fullName} ${c.phone}`)).slice(0, 6).forEach(c =>
      results.push({ id: `c${c.id}`, group: 'Клиенты', icon: Users, title: c.fullName, sub: c.phone, run: () => go('/clients') }))
    data.rentals.filter(r => match(`${r.vehicle?.brand} ${r.vehicle?.model} ${r.client?.fullName} ${r.id}`)).slice(0, 6).forEach(r =>
      results.push({ id: `r${r.id}`, group: 'Аренды', icon: KeyRound, title: `${r.vehicle?.brand || ''} ${r.vehicle?.model || ''} · #${r.id}`, sub: r.client?.fullName || '', run: () => go('/rentals') }))
  }
  results = results.slice(0, 40)

  // keyboard nav inside list
  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(results.length - 1, s + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); results[sel]?.run() }
  }

  if (!open) return null

  // group consecutively for headers
  const groups: { name: string; items: { cmd: Cmd; idx: number }[] }[] = []
  results.forEach((cmd, idx) => {
    const g = groups[groups.length - 1]
    if (g && g.name === cmd.group) g.items.push({ cmd, idx })
    else groups.push({ name: cmd.group, items: [{ cmd, idx }] })
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <div className="modal-overlay" onClick={close} />
      <div className="relative w-full max-w-xl glass-strong rounded-2xl overflow-hidden modal-pop" onKeyDown={onListKey}>
        <div className="flex items-center gap-3 px-4 border-b border-[var(--border)]">
          <Search className="w-[18px] h-[18px] text-[var(--ink-subtle)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => { setQ(e.target.value); setSel(0) }}
            placeholder="Поиск или команда…  (клиент, авто, аренда)"
            className="flex-1 bg-transparent outline-none py-4 text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-subtle)]"
          />
          <kbd className="kbd">ESC</kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto scroll-refined p-2">
          {results.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[var(--ink-subtle)]">Ничего не найдено</div>
          ) : groups.map(g => (
            <div key={g.name} className="mb-1">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-subtle)]">{g.name}</p>
              {g.items.map(({ cmd, idx }) => {
                const Icon = cmd.icon
                return (
                  <button
                    key={cmd.id}
                    onMouseEnter={() => setSel(idx)}
                    onClick={cmd.run}
                    className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors', idx === sel ? 'bg-[var(--surface-3)]' : 'hover:bg-[var(--surface-2)]')}
                  >
                    <span className="icon-soft icon-soft-neutral w-8 h-8"><Icon className="w-4 h-4" /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium text-[var(--ink)] truncate">{cmd.title}</p>
                      {cmd.sub && <p className="text-[11px] text-[var(--ink-subtle)] truncate">{cmd.sub}</p>}
                    </div>
                    {idx === sel && <CornerDownLeft className="w-3.5 h-3.5 text-[var(--ink-subtle)]" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--border)] text-[11px] text-[var(--ink-subtle)]">
          <span className="flex items-center gap-1"><CircleDollarSign className="w-3 h-3" />UNICAR</span>
          <span className="ml-auto flex items-center gap-2"><kbd className="kbd">↑↓</kbd> навигация <kbd className="kbd">↵</kbd> выбрать</span>
        </div>
      </div>
    </div>
  )
}
