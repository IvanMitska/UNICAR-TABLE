import { useState, useEffect, useMemo, useCallback, useRef, useReducer } from 'react'
import type { Vehicle, Rental, RentalStatus, Client, RentalFormData } from '@/types'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight, CalendarDays, AlertTriangle, Search, Plus, X, User, Banknote, Clock, Pencil, GripVertical } from 'lucide-react'
import { RentalModal } from './RentalsPage'
import { packLanes, rangeOverlap, clampIdx as clamp } from '@/utils/calendar'

const statusBar: Record<RentalStatus, { bg: string; shadow: string; label: string }> = {
  active: { bg: 'linear-gradient(135deg,#34d399,#059669)', shadow: '0 4px 12px -4px rgba(5,150,105,0.6)', label: 'Активна' },
  overdue: { bg: 'linear-gradient(135deg,#fb7185,#e11d48)', shadow: '0 4px 12px -4px rgba(225,29,72,0.6)', label: 'Просрочена' },
  completed: { bg: 'linear-gradient(135deg,#71717a,#52525b)', shadow: '0 2px 8px -3px rgba(0,0,0,0.5)', label: 'Завершена' },
  cancelled: { bg: 'linear-gradient(135deg,#a1a1aa,#71717a)', shadow: 'none', label: 'Отменена' },
}
const LINE = 'rgba(130,130,130,0.10)', LINE_WEEK = 'rgba(130,130,130,0.22)', WEEKEND = 'rgba(130,130,130,0.05)', TODAY_BG = 'rgba(245,158,11,0.12)'
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const DOW = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
const dayMs = 86400000
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const pad = (n: number) => String(n).padStart(2, '0')
const isoLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const num = (x: unknown) => Number(x) || 0
const fmtMoney = (n: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n)
const hhmm = (s: string) => new Date(s).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

type Bar = { r: Rental; rawStart: number; rawEnd: number; startIdx: number; endIdx: number; span: number; conflict: boolean; lane: number }
type Drag = { id: number; vehicleId: number; mode: 'move' | 'resize'; startX: number; downX: number; downY: number; rawStart: number; rawEnd: number; curStart: number; curEnd: number; moved: boolean }

export default function CalendarPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [rentals, setRentals] = useState<Rental[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'month' | 'week'>('month')
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const [statusFilter, setStatusFilter] = useState<'all' | RentalStatus>('all')
  const [vehFilter, setVehFilter] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all')
  const [pop, setPop] = useState<{ r: Rental; x: number; y: number } | null>(null)
  const [newRental, setNewRental] = useState<{ vehicleId: number; start: string } | null>(null)
  const [editRental, setEditRental] = useState<Rental | null>(null)

  const dragRef = useRef<Drag | null>(null)
  const [, force] = useReducer((x: number) => x + 1, 0)
  const today = startOfDay(new Date())

  const fetchAll = useCallback(async () => {
    try {
      const [v, r, c] = await Promise.all([fetch('/api/vehicles'), fetch('/api/rentals'), fetch('/api/clients')])
      if (v.ok) setVehicles(await v.json())
      if (r.ok) setRentals((await r.json()).map((x: Rental) => ({ ...x, totalAmount: num(x.totalAmount), deposit: num(x.deposit), rateAmount: num(x.rateAmount) })))
      if (c.ok) setClients(await c.json())
    } catch (e) { console.error(e) } finally { setIsLoading(false) }
  }, [])
  useEffect(() => { fetchAll() }, [fetchAll])

  // ---- visible range ----
  const range = useMemo(() => {
    if (mode === 'week') {
      const dow = anchor.getDay(); const monday = addDays(anchor, -((dow + 6) % 7))
      return { start: startOfDay(monday), days: Array.from({ length: 7 }, (_, i) => addDays(monday, i)) }
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const n = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()
    return { start: startOfDay(first), days: Array.from({ length: n }, (_, i) => new Date(anchor.getFullYear(), anchor.getMonth(), i + 1)) }
  }, [mode, anchor])
  const days = range.days, count = days.length
  const COL = mode === 'week' ? 196 : 46
  const todayIdx = days.findIndex(d => d.getTime() === today.getTime())

  const fleet = vehicles.filter(v => v.status !== 'archived')
    .filter(v => vehFilter === 'all' || v.status === vehFilter)
    .filter(v => search === '' || `${v.brand} ${v.model} ${v.licensePlate}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`))

  const byVehicle = useMemo(() => {
    const raw = new Map<number, Bar[]>()
    const ms = range.start.getTime(), me = addDays(range.start, count - 1).getTime()
    rentals.filter(r => r.status !== 'cancelled' && (statusFilter === 'all' || r.status === statusFilter)).forEach(r => {
      const s = startOfDay(new Date(r.startDate)).getTime()
      const e = startOfDay(new Date(r.actualEndDate || r.plannedEndDate)).getTime()
      if (e < ms || s > me) return
      const rawStart = Math.round((s - ms) / dayMs), rawEnd = Math.round((e - ms) / dayMs)
      const startIdx = clamp(rawStart, 0, count - 1), endIdx = clamp(rawEnd, 0, count - 1)
      const arr = raw.get(r.vehicleId) || []
      arr.push({ r, rawStart, rawEnd, startIdx, endIdx, span: Math.max(1, endIdx - startIdx + 1), conflict: false, lane: 0 })
      raw.set(r.vehicleId, arr)
    })
    const map = new Map<number, { bars: Bar[]; lanes: number }>()
    raw.forEach((bars, vid) => { map.set(vid, packLanes(bars)) })
    return map
  }, [rentals, range, count, statusFilter])

  const conflicts = useMemo(() => { let c = 0; byVehicle.forEach(({ bars }) => { if (bars.some(x => x.conflict)) c++ }); return c }, [byVehicle])

  const move = (delta: number) => setAnchor(a => mode === 'week' ? addDays(a, delta * 7) : new Date(a.getFullYear(), a.getMonth() + delta, 1))
  const goToday = () => setAnchor(startOfDay(new Date()))
  const createRental = (vehicleId: number, day: Date) => { setPop(null); setNewRental({ vehicleId, start: isoLocal(day) }) }

  const handleSaveRental = async (data: RentalFormData) => {
    const res = await fetch('/api/rentals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { setNewRental(null); fetchAll() }
  }
  const handleUpdateRental = async (data: RentalFormData) => {
    if (!editRental) return
    const res = await fetch(`/api/rentals/${editRental.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { setEditRental(null); fetchAll() }
  }

  // ---- drag & drop (move + resize) ----
  const beginDrag = (e: React.MouseEvent, b: Bar, vehicleId: number, dmode: 'move' | 'resize') => {
    e.preventDefault(); e.stopPropagation()
    dragRef.current = { id: b.r.id, vehicleId, mode: dmode, startX: e.clientX, downX: e.clientX, downY: e.clientY, rawStart: b.rawStart, rawEnd: b.rawEnd, curStart: b.rawStart, curEnd: b.rawEnd, moved: false }
    const onMove = (ev: MouseEvent) => {
      const dr = dragRef.current; if (!dr) return
      const delta = Math.round((ev.clientX - dr.startX) / COL)
      if (Math.abs(ev.clientX - dr.startX) > 3) dr.moved = true
      if (dr.mode === 'move') { dr.curStart = dr.rawStart + delta; dr.curEnd = dr.rawEnd + delta }
      else { dr.curEnd = Math.max(dr.rawStart, dr.rawEnd + delta) }
      force()
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp)
      const dr = dragRef.current; dragRef.current = null
      if (!dr) return
      if (!dr.moved) { setPop({ r: b.r, x: dr.downX, y: dr.downY }); force(); return }
      commitDrag(dr); force()
    }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }

  const commitDrag = (dr: Drag) => {
    if (dr.curStart === dr.rawStart && dr.curEnd === dr.rawEnd) return
    const others = (byVehicle.get(dr.vehicleId)?.bars || []).filter(b => b.r.id !== dr.id)
    const conflict = others.some(o => rangeOverlap(dr.curStart, dr.curEnd, o.rawStart, o.rawEnd))
    if (conflict) { window.alert('Перенос отменён: пересечение с другой бронью этого авто.'); return }
    const r = rentals.find(x => x.id === dr.id); if (!r) return
    const keepTime = (origISO: string, dayOffset: number) => { const o = new Date(origISO); const nd = addDays(range.start, dayOffset); nd.setHours(o.getHours(), o.getMinutes(), 0, 0); return nd.toISOString() }
    const body: Record<string, unknown> = {
      startDate: dr.mode === 'move' ? keepTime(r.startDate, dr.curStart) : r.startDate,
      plannedEndDate: keepTime(r.plannedEndDate, dr.curEnd),
      rateType: r.rateType, rateAmount: r.rateAmount, deposit: r.deposit,
      paymentMethod: r.paymentMethod, paymentStatus: r.paymentStatus, extras: r.extras, conditionStart: r.conditionStart, notes: r.notes,
    }
    // optimistic
    setRentals(prev => prev.map(x => x.id === r.id ? { ...x, startDate: body.startDate as string, plannedEndDate: body.plannedEndDate as string, actualEndDate: null } : x))
    fetch(`/api/rentals/${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(res => { if (res.ok) fetchAll() })
  }

  const dayCellBg = (i: number, dow: number) => i === todayIdx ? TODAY_BG : (dow === 0 || dow === 6) ? WEEKEND : 'transparent'
  const LABEL = 212, MIN_ROW = 56, PAD = 6, LGAP = 4
  const hasBars = [...byVehicle.values()].some(x => x.bars.length > 0)
  const periodLabel = mode === 'week'
    ? `${days[0].getDate()}–${days[6].getDate()} ${MONTHS[days[6].getMonth()].slice(0, 3).toLowerCase()} ${days[6].getFullYear()}`
    : `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`

  if (isLoading) return <div className="flex flex-col gap-6 max-w-7xl mx-auto"><div className="h-12 rounded-xl skeleton w-72" /><div className="h-[500px] rounded-2xl skeleton" /></div>

  return (
    <div className={clsx('flex flex-col gap-4 w-full', dragRef.current && 'select-none')}>
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 fade-up">
        <div>
          <p className="eyebrow mb-1.5">Планирование</p>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[var(--ink)] leading-none">Календарь аренд</h1>
            {conflicts > 0 && <span className="pill pill-danger"><AlertTriangle className="w-3 h-3" />{conflicts} конфликт.</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="segment">
            <button onClick={() => setMode('month')} className={clsx('segment-item', mode === 'month' && 'is-active')}>Месяц</button>
            <button onClick={() => setMode('week')} className={clsx('segment-item', mode === 'week' && 'is-active')}>Неделя</button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => move(-1)} className="btn-icon"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={goToday} className="btn-secondary !py-2 text-[13px] min-w-[170px] justify-center"><CalendarDays className="w-4 h-4" />{periodLabel}</button>
            <button onClick={() => move(1)} className="btn-icon"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap fade-up">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-subtle)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск авто…" className="input !pl-10 !py-2 w-44" />
        </div>
        <div className="segment">
          {([['all', 'Все'], ['active', 'Активные'], ['overdue', 'Просроч.'], ['completed', 'Завершён.']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setStatusFilter(k)} className={clsx('segment-item', statusFilter === k && 'is-active')}>{l}</button>
          ))}
        </div>
        <div className="segment">
          {([['all', 'Весь парк'], ['available', 'Свободные'], ['rented', 'В аренде'], ['maintenance', 'На ТО']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setVehFilter(k)} className={clsx('segment-item', vehFilter === k && 'is-active')}>{l}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3 text-[11.5px] text-[var(--ink-muted)]">
          {(['active', 'overdue', 'completed'] as RentalStatus[]).map(s => (
            <span key={s} className="inline-flex items-center gap-1.5"><span className="w-4 h-2.5 rounded-full" style={{ background: statusBar[s].bg }} />{statusBar[s].label}</span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="card overflow-hidden fade-up p-0">
        <div className="overflow-x-auto scroll-refined">
          <div style={{ minWidth: LABEL + count * COL }}>
            {/* Day header */}
            <div className="flex sticky top-0 z-20" style={{ background: 'var(--surface)', borderBottom: `1px solid var(--border)` }}>
              <div className="shrink-0 sticky left-0 z-10 flex items-center px-4" style={{ width: LABEL, background: 'var(--surface)', borderRight: `1px solid var(--border)`, height: 48 }}>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-subtle)]">Автомобиль ({fleet.length})</span>
              </div>
              <div className="flex">
                {days.map((d, i) => {
                  const dow = d.getDay(); const isToday = i === todayIdx
                  return (
                    <div key={i} className="shrink-0 flex flex-col items-center justify-center gap-0.5" style={{ width: COL, height: 48, background: dayCellBg(i, dow), borderRight: dow === 0 ? `1px solid ${LINE_WEEK}` : `1px solid ${LINE}` }}>
                      <span className={clsx('flex items-center justify-center text-[11.5px] font-semibold rounded-full', isToday ? 'text-[#1a1205]' : 'text-[var(--ink-2)]')} style={isToday ? { width: 20, height: 20, background: 'var(--accent-bright)' } : undefined}>{d.getDate()}</span>
                      <span className={clsx('text-[9px] uppercase', (dow === 0 || dow === 6) ? 'text-rose-400/70' : 'text-[var(--ink-subtle)]')}>{DOW[dow]}{mode === 'week' ? ` · ${MONTHS[d.getMonth()].slice(0, 3).toLowerCase()}` : ''}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rows */}
            {fleet.length === 0 ? (
              <div className="py-16 text-center text-[13px] text-[var(--ink-subtle)]">Авто не найдены</div>
            ) : (
              <div className="relative">
                {fleet.map((v, ri) => {
                  const { bars, lanes } = byVehicle.get(v.id) || { bars: [], lanes: 0 }
                  const stripe = v.status === 'rented' ? '#10b981' : v.status === 'maintenance' ? '#f59e0b' : 'var(--border-strong)'
                  const L = Math.max(1, lanes)
                  const barH = L === 1 ? 28 : Math.max(14, Math.floor((MIN_ROW - 2 * PAD - (L - 1) * LGAP) / L))
                  const barTop = (lane: number) => L === 1 ? (MIN_ROW - barH) / 2 : PAD + lane * (barH + LGAP)
                  const occupied = new Set<number>()
                  bars.forEach(b => { for (let i = b.startIdx; i <= b.endIdx; i++) occupied.add(i) })
                  return (
                    <div key={v.id} className="flex group/row" style={{ background: ri % 2 ? 'var(--surface-2)' : 'transparent' }}>
                      <div className="shrink-0 sticky left-0 z-10 flex items-center gap-2.5 px-4 transition-colors group-hover/row:bg-[var(--surface-3)]" style={{ width: LABEL, height: MIN_ROW, background: ri % 2 ? 'var(--surface-2)' : 'var(--surface)', borderRight: `1px solid var(--border)`, borderBottom: `1px solid ${LINE}` }}>
                        <span className="w-1 h-7 rounded-full shrink-0" style={{ background: stripe }} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[var(--ink)] truncate leading-tight">{v.brand} {v.model}</p>
                          <p className="text-[10.5px] font-mono text-[var(--ink-subtle)] leading-tight">{v.licensePlate}</p>
                        </div>
                        {lanes > 1 && <span className="ml-auto pill pill-danger !px-1.5 !py-0 text-[9px] shrink-0"><AlertTriangle className="w-2.5 h-2.5" />{lanes}</span>}
                      </div>
                      <div className="relative" style={{ width: count * COL, height: MIN_ROW, borderBottom: `1px solid ${LINE}` }}>
                        <div className="absolute inset-0 flex">
                          {days.map((d, i) => {
                            const dow = d.getDay(); const busy = occupied.has(i); const bg = dayCellBg(i, dow); const br = dow === 0 ? `1px solid ${LINE_WEEK}` : `1px solid ${LINE}`
                            if (busy) return <div key={i} className="shrink-0" style={{ width: COL, height: '100%', background: bg, borderRight: br }} />
                            return (
                              <button key={i} onClick={() => createRental(v.id, d)} title={`Новая аренда · ${v.brand} ${v.model} · ${d.toLocaleDateString('ru-RU')}`} className="group/cell shrink-0 flex items-center justify-center hover:bg-[rgba(245,158,11,0.07)]" style={{ width: COL, height: '100%', background: bg, borderRight: br }}>
                                <span className="opacity-0 group-hover/cell:opacity-100 transition-opacity w-5 h-5 rounded-full flex items-center justify-center shadow" style={{ background: 'var(--accent-bright)' }}><Plus className="w-3 h-3" style={{ color: '#1a1205' }} /></span>
                              </button>
                            )
                          })}
                        </div>
                        {/* bars */}
                        {bars.map((b) => {
                          const dr = dragRef.current?.id === b.r.id ? dragRef.current : null
                          const cs = dr ? clamp(dr.curStart, 0, count - 1) : b.startIdx
                          const ce = dr ? clamp(dr.curEnd, 0, count - 1) : b.endIdx
                          const left = cs * COL + 3, w = (ce - cs + 1) * COL - 6
                          const showLabel = w >= 56 && barH >= 18
                          const r = b.r
                          const range2 = `${new Date(r.startDate).toLocaleDateString('ru-RU')} — ${new Date(r.actualEndDate || r.plannedEndDate).toLocaleDateString('ru-RU')}`
                          const label = mode === 'week' ? `${r.client?.fullName || `#${r.id}`} · ${hhmm(r.startDate)}` : (r.client?.fullName || `#${r.id}`)
                          return (
                            <div
                              key={r.id}
                              onMouseDown={(e) => beginDrag(e, b, v.id, 'move')}
                              title={`${r.client?.fullName || `#${r.id}`}\n${range2}\n${statusBar[r.status].label} · ${fmtMoney(num(r.totalAmount))}`}
                              className={clsx('group absolute rounded-full flex items-center text-[11px] font-semibold text-white overflow-hidden cursor-grab active:cursor-grabbing', showLabel ? 'px-2.5 justify-start' : 'justify-center px-0', b.conflict && 'ring-[1.5px] ring-rose-400', dr && 'z-[9] scale-[1.02]')}
                              style={{ left, width: w, top: barTop(b.lane), height: barH, background: statusBar[r.status].bg, boxShadow: statusBar[r.status].shadow, zIndex: dr ? 9 : b.conflict ? 6 : 4, textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
                            >
                              {b.conflict && showLabel && <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />}
                              {showLabel ? <span className="truncate flex-1">{label}</span> : <span className="rounded-full bg-white/90" style={{ width: 5, height: 5 }} />}
                              {/* resize handle (right edge) */}
                              {showLabel && (
                                <span onMouseDown={(e) => beginDrag(e, b, v.id, 'resize')} className="ml-1 shrink-0 h-full flex items-center px-0.5 cursor-ew-resize opacity-60 hover:opacity-100" title="Изменить срок">
                                  <GripVertical className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {!hasBars && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginLeft: LABEL }}>
                    <div className="text-center px-6 py-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <p className="text-[13px] font-medium text-[var(--ink-2)]">Нет аренд в этом периоде</p>
                      <p className="text-[11.5px] text-[var(--ink-subtle)] mt-0.5">Кликните по свободному дню, чтобы создать</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[var(--ink-subtle)] -mt-1">Подсказка: перетащите бронь мышью, чтобы перенести; тяните за правый край — изменить срок. Клик по пустому дню — новая аренда.</p>

      {pop && <RentalPopover state={pop} onClose={() => setPop(null)} onEdit={() => { const r = pop.r; setPop(null); setEditRental(r) }} />}

      {newRental && (
        <RentalModal rental={null} presetVehicleId={newRental.vehicleId} presetStart={newRental.start}
          vehicles={vehicles.filter(v => v.status === 'available' || v.id === newRental.vehicleId)} clients={clients.filter(c => c.status === 'active')}
          onClose={() => setNewRental(null)} onSave={handleSaveRental} onClientCreated={(nc) => setClients(prev => [...prev, nc])} />
      )}
      {editRental && (
        <RentalModal rental={editRental}
          vehicles={vehicles.filter(v => v.status === 'available' || v.id === editRental.vehicleId)} clients={clients.filter(c => c.status === 'active')}
          onClose={() => setEditRental(null)} onSave={handleUpdateRental} onClientCreated={(nc) => setClients(prev => [...prev, nc])} />
      )}
    </div>
  )
}

function RentalPopover({ state, onClose, onEdit }: { state: { r: Rental; x: number; y: number }; onClose: () => void; onEdit: () => void }) {
  const r = state.r
  const W = 330
  const left = Math.max(12, Math.min(state.x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - W - 12))
  const top = Math.max(12, Math.min(state.y + 14, (typeof window !== 'undefined' ? window.innerHeight : 800) - 320))
  const sPill = r.status === 'active' ? 'pill-success' : r.status === 'overdue' ? 'pill-danger' : 'pill-neutral'
  const pPill = r.paymentStatus === 'paid' ? 'pill-success' : r.paymentStatus === 'partial' ? 'pill-warning' : 'pill-danger'
  const Line = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div className="flex items-center gap-2.5 text-[12.5px]"><span className="text-[var(--ink-subtle)]">{icon}</span><span className="text-[var(--ink-muted)] w-[72px] shrink-0">{label}</span><span className="font-medium text-[var(--ink)] flex-1 text-right truncate">{value}</span></div>
  )
  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div className="fixed z-[61] glass-strong rounded-2xl p-4 modal-pop" style={{ left, top, width: W }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0"><p className="text-[14px] font-bold text-[var(--ink)] truncate">{r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : `Аренда #${r.id}`}</p><p className="text-[11px] font-mono text-[var(--ink-subtle)]">{r.vehicle?.licensePlate || ''} · #{r.id}</p></div>
          <button onClick={onClose} className="btn-icon !w-7 !h-7 shrink-0"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className={clsx('pill', sPill)}>{statusBar[r.status]?.label || r.status}</span>
          <span className={clsx('pill', pPill)}>{r.paymentStatus === 'paid' ? 'оплачено' : r.paymentStatus === 'partial' ? 'частично' : 'не оплачено'}</span>
        </div>
        <div className="space-y-2 py-3 border-t border-b border-[var(--border)]">
          <Line icon={<User className="w-4 h-4" />} label="Клиент" value={r.client?.fullName || '—'} />
          <Line icon={<Clock className="w-4 h-4" />} label="Период" value={`${new Date(r.startDate).toLocaleDateString('ru-RU')} — ${new Date(r.actualEndDate || r.plannedEndDate).toLocaleDateString('ru-RU')}`} />
          <Line icon={<Banknote className="w-4 h-4" />} label="Сумма" value={fmtMoney(num(r.totalAmount))} />
          <Line icon={<Banknote className="w-4 h-4" />} label="Депозит" value={fmtMoney(num(r.deposit))} />
        </div>
        <button onClick={onEdit} className="btn-primary w-full !py-2 mt-3 text-[13px]"><Pencil className="w-4 h-4" /> Открыть аренду</button>
      </div>
    </>
  )
}
