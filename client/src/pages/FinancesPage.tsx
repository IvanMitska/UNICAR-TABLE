import { useState, useEffect, useMemo } from 'react'
import type { Expense, Vehicle, ExpenseFormData, ExpenseCategory, Rental, Maintenance, PaymentMethod } from '@/types'
import clsx from 'clsx'
import DatePicker from '@/components/ui/DatePicker'
import SelectDropdown from '@/components/ui/SelectDropdown'
import { CountUp } from '@/components/ui/CountUp'
import {
  Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, BarChart3, Car,
  Plus, X, Banknote, CreditCard, ArrowLeftRight, ReceiptText, AlertCircle,
  ShieldCheck, FileSpreadsheet, Printer, Download, Coins, ChevronRight,
} from 'lucide-react'

/* ============================ constants ============================ */
const categoryLabels: Record<ExpenseCategory, string> = {
  maintenance: 'Обслуживание', insurance: 'Страховка', fuel: 'Топливо', fine: 'Штраф', other: 'Прочее',
}
const methodLabels: Record<PaymentMethod, string> = { cash: 'Наличные', card: 'Карта', transfer: 'Перевод' }
const methodIcon: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="w-3.5 h-3.5" />, card: <CreditCard className="w-3.5 h-3.5" />, transfer: <ArrowLeftRight className="w-3.5 h-3.5" />,
}

type TabKey = 'overview' | 'ledger' | 'receivables' | 'deposits' | 'vehicles' | 'reports'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Обзор' },
  { key: 'ledger', label: 'Журнал' },
  { key: 'receivables', label: 'Дебиторка' },
  { key: 'deposits', label: 'Депозиты' },
  { key: 'vehicles', label: 'По авто' },
  { key: 'reports', label: 'Отчёты' },
]

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n)
const fmtNum = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n))
const fmtDate = (s: string) => new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
const pad = (n: number) => String(n).padStart(2, '0')
// Local Y-M-D (no UTC drift, unlike toISOString)
const isoLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const isoToday = () => isoLocal(new Date())

/* Period presets */
function periodPresets() {
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth()
  return [
    { key: 'month', label: 'Этот месяц', from: isoLocal(new Date(y, m, 1)), to: isoToday() },
    { key: 'prev', label: 'Прошлый месяц', from: isoLocal(new Date(y, m - 1, 1)), to: isoLocal(new Date(y, m, 0)) },
    { key: 'quarter', label: 'Квартал', from: isoLocal(new Date(y, m - 2, 1)), to: isoToday() },
    { key: 'year', label: 'Год', from: isoLocal(new Date(y, 0, 1)), to: isoToday() },
    { key: 'all', label: 'Всё время', from: '2000-01-01', to: '2100-01-01' },
  ]
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => {
    const s = String(c ?? '')
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/* ============================ page ============================ */
export default function FinancesPage() {
  const [rentals, setRentals] = useState<Rental[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [maintenance, setMaintenance] = useState<Maintenance[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tab, setTab] = useState<TabKey>('overview')

  const presets = periodPresets()
  // Default to year-to-date so existing data is visible immediately
  const [period, setPeriod] = useState({ from: presets[3].from, to: presets[3].to, key: 'year' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const n = (x: unknown) => Number(x) || 0
    try {
      const [r, e, m, v] = await Promise.all([
        fetch('/api/rentals'), fetch('/api/expenses'), fetch('/api/maintenance'), fetch('/api/vehicles'),
      ])
      // PostgreSQL returns DECIMAL columns as strings — coerce numeric fields.
      if (r.ok) setRentals((await r.json()).map((x: Rental) => ({ ...x, totalAmount: n(x.totalAmount), deposit: n(x.deposit), rateAmount: n(x.rateAmount) })))
      if (e.ok) setExpenses((await e.json()).map((x: Expense) => ({ ...x, amount: n(x.amount) })))
      if (m.ok) setMaintenance((await m.json()).map((x: Maintenance) => ({ ...x, cost: n(x.cost) })))
      if (v.ok) setVehicles(await v.json())
    } catch (err) {
      console.error('Failed to fetch finance data:', err)
    } finally { setIsLoading(false) }
  }

  const handleSaveExpense = async (data: ExpenseFormData) => {
    try {
      const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { fetchData(); setIsModalOpen(false) }
    } catch (err) { console.error('Failed to save expense:', err) }
  }

  // Mark a rental as paid — sends full existing fields (PUT recalculates total from dates)
  const markPaid = async (r: Rental) => {
    try {
      const res = await fetch(`/api/rentals/${r.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plannedEndDate: r.plannedEndDate, rateType: r.rateType, rateAmount: r.rateAmount,
          deposit: r.deposit, paymentMethod: r.paymentMethod, paymentStatus: 'paid',
          extras: r.extras, conditionStart: r.conditionStart, notes: r.notes,
        }),
      })
      if (res.ok) {
        setRentals(prev => prev.map(x => x.id === r.id ? { ...x, paymentStatus: 'paid' } : x))
      }
    } catch (err) { console.error('Failed to mark paid:', err) }
  }

  /* ---------------- derived accounting data ---------------- */
  const A = useMemo(() => {
    const inRange = (d: string | null | undefined) => { if (!d) return false; const x = d.slice(0, 10); return x >= period.from && x <= period.to }
    const revDate = (r: Rental) => (r.actualEndDate || r.startDate).slice(0, 10)
    const live = rentals.filter(r => r.status !== 'cancelled')

    const periodRentals = live.filter(r => inRange(revDate(r)))
    const periodExpenses = expenses.filter(e => inRange(e.date))
    const periodMaint = maintenance.filter(m => inRange(m.date))

    const revenue = periodRentals.reduce((s, r) => s + (r.totalAmount || 0), 0)
    const received = periodRentals.filter(r => r.paymentStatus === 'paid').reduce((s, r) => s + (r.totalAmount || 0), 0)
    const expensesSum = periodExpenses.reduce((s, e) => s + (e.amount || 0), 0)
    const maintSum = periodMaint.reduce((s, m) => s + (m.cost || 0), 0)
    const expenseTotal = expensesSum + maintSum
    const profit = revenue - expenseTotal
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

    // current receivables (all-time outstanding)
    const receivablesList = live.filter(r => r.paymentStatus !== 'paid' && (r.totalAmount || 0) > 0)
      .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
    const receivables = receivablesList.reduce((s, r) => s + (r.totalAmount || 0), 0)

    // deposits held now
    const depositsList = live.filter(r => (r.deposit || 0) > 0)
    const heldList = depositsList.filter(r => !r.depositReturned && (r.status === 'active' || r.status === 'overdue'))
    const depositsHeld = heldList.reduce((s, r) => s + (r.deposit || 0), 0)
    const depositsReturned = depositsList.filter(r => r.depositReturned).reduce((s, r) => s + (r.deposit || 0), 0)

    // payment split (received, by method)
    const split: Record<PaymentMethod, number> = { cash: 0, card: 0, transfer: 0 }
    periodRentals.filter(r => r.paymentStatus === 'paid').forEach(r => { split[r.paymentMethod] = (split[r.paymentMethod] || 0) + (r.totalAmount || 0) })

    // expense breakdown
    const byCat: Record<string, number> = {}
    periodExpenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount })
    if (maintSum > 0) byCat['ТО'] = maintSum
    const expenseBreakdown = Object.entries(byCat).map(([k, v]) => ({ key: k, label: categoryLabels[k as ExpenseCategory] || k, value: v })).sort((a, b) => b.value - a.value)

    // ledger transactions
    type Txn = { id: string; date: string; kind: 'income' | 'expense' | 'deposit_in' | 'deposit_out'; title: string; sub: string; vehicle: string; method?: PaymentMethod; status?: string; amount: number }
    const txns: Txn[] = []
    periodRentals.forEach(r => {
      const veh = r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : '—'
      txns.push({ id: `r${r.id}`, date: revDate(r), kind: 'income', title: 'Аренда', sub: r.client?.fullName || '', vehicle: veh, method: r.paymentMethod, status: r.paymentStatus, amount: r.totalAmount || 0 })
    })
    live.forEach(r => {
      if ((r.deposit || 0) <= 0) return
      const veh = r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : '—'
      if (inRange(r.startDate)) txns.push({ id: `di${r.id}`, date: r.startDate.slice(0, 10), kind: 'deposit_in', title: 'Депозит получен', sub: r.client?.fullName || '', vehicle: veh, amount: r.deposit })
      if (r.depositReturned && r.actualEndDate && inRange(r.actualEndDate)) txns.push({ id: `do${r.id}`, date: r.actualEndDate.slice(0, 10), kind: 'deposit_out', title: 'Депозит возвращён', sub: r.client?.fullName || '', vehicle: veh, amount: -r.deposit })
    })
    periodExpenses.forEach(e => {
      const veh = e.vehicle ? `${e.vehicle.brand} ${e.vehicle.model}` : '—'
      txns.push({ id: `e${e.id}`, date: e.date.slice(0, 10), kind: 'expense', title: categoryLabels[e.category] || 'Расход', sub: e.description, vehicle: veh, amount: -e.amount })
    })
    periodMaint.forEach(m => {
      const veh = m.vehicle ? `${m.vehicle.brand} ${m.vehicle.model}` : '—'
      txns.push({ id: `m${m.id}`, date: m.date.slice(0, 10), kind: 'expense', title: 'Обслуживание', sub: m.description, vehicle: veh, amount: -m.cost })
    })
    txns.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0)
    let bal = 0
    const txnsWithBal = txns.map(t => { bal += t.amount; return { ...t, balance: bal } })

    // cash-flow buckets
    const rangeDays = Math.max(1, Math.round((new Date(period.to).getTime() - new Date(period.from).getTime()) / 86400000))
    const byMonth = rangeDays > 70
    const buckets: Record<string, { income: number; expense: number }> = {}
    const bk = (d: string) => byMonth ? d.slice(0, 7) : d.slice(0, 10)
    periodRentals.forEach(r => { const k = bk(revDate(r)); (buckets[k] ||= { income: 0, expense: 0 }).income += r.totalAmount || 0 })
    periodExpenses.forEach(e => { const k = bk(e.date); (buckets[k] ||= { income: 0, expense: 0 }).expense += e.amount })
    periodMaint.forEach(m => { const k = bk(m.date); (buckets[k] ||= { income: 0, expense: 0 }).expense += m.cost })
    const cashflow = Object.entries(buckets).sort((a, b) => a[0] < b[0] ? -1 : 1).map(([k, v]) => ({ k, ...v }))

    // per-vehicle P&L
    const perVehicle = vehicles.filter(v => v.status !== 'archived').map(v => {
      const rev = periodRentals.filter(r => r.vehicleId === v.id).reduce((s, r) => s + (r.totalAmount || 0), 0)
      const exp = periodExpenses.filter(e => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0)
        + periodMaint.filter(m => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0)
      const count = periodRentals.filter(r => r.vehicleId === v.id).length
      return { v, rev, exp, profit: rev - exp, margin: rev > 0 ? ((rev - exp) / rev) * 100 : 0, count }
    }).filter(x => x.rev > 0 || x.exp > 0).sort((a, b) => b.profit - a.profit)

    return {
      revenue, received, expenseTotal, expensesSum, maintSum, profit, margin,
      receivables, receivablesList, depositsHeld, depositsReturned, heldList, depositsList,
      split, expenseBreakdown, txns: txnsWithBal, cashflow, perVehicle, periodRentals,
    }
  }, [rentals, expenses, maintenance, vehicles, period])

  const setPreset = (p: { from: string; to: string; key: string }) => setPeriod({ from: p.from, to: p.to, key: p.key })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-[116px] rounded-[18px] skeleton" />)}</div>
        <div className="h-10 rounded-full skeleton w-full max-w-md" />
        <div className="h-[320px] rounded-2xl skeleton" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 fade-up no-print">
        <div>
          <p className="eyebrow mb-1.5">Бухгалтерия</p>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[var(--ink)] leading-none">Финансы</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="segment overflow-x-auto">
            {presets.map(p => (
              <button key={p.key} onClick={() => setPreset(p)} className={clsx('segment-item', period.key === p.key && 'is-active')}>{p.label}</button>
            ))}
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" /> Расход</button>
        </div>
      </header>

      {/* Custom range */}
      <div className="flex items-center gap-3 -mt-2 fade-up no-print">
        <div className="flex items-center gap-2">
          <DatePicker value={period.from} onChange={(v) => setPeriod({ ...period, from: v, key: 'custom' })} className="w-40" />
          <span className="text-[var(--ink-subtle)]">—</span>
          <DatePicker value={period.to} onChange={(v) => setPeriod({ ...period, to: v, key: 'custom' })} className="w-40" />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-animation">
        <Kpi label="Выручка" value={A.revenue} icon={<TrendingUp className="w-[18px] h-[18px]" />} tone="emerald" />
        <Kpi label="Чистая прибыль" value={A.profit} icon={<Wallet className="w-[18px] h-[18px]" />} tone="accent"
          extra={A.revenue > 0 ? `маржа ${Math.round(A.margin)}%` : undefined} />
        <Kpi label="К получению" value={A.receivables} icon={<AlertCircle className="w-[18px] h-[18px]" />} tone="rose"
          extra={A.receivablesList.length ? `${A.receivablesList.length} аренд` : 'всё оплачено'} onClick={() => setTab('receivables')} />
        <Kpi label="Депозиты в залоге" value={A.depositsHeld} icon={<ShieldCheck className="w-[18px] h-[18px]" />} tone="neutral"
          extra={A.heldList.length ? `${A.heldList.length} активных` : '—'} onClick={() => setTab('deposits')} />
      </div>

      {/* Tabs */}
      <div className="segment overflow-x-auto max-w-full fade-up no-print">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={clsx('segment-item', tab === t.key && 'is-active')}>
            {t.label}
            {t.key === 'receivables' && A.receivablesList.length > 0 && <span className="segment-item-count">{A.receivablesList.length}</span>}
          </button>
        ))}
      </div>

      {/* ---- Tab content ---- */}
      {tab === 'overview' && <OverviewTab A={A} />}
      {tab === 'ledger' && <LedgerTab A={A} period={period} />}
      {tab === 'receivables' && <ReceivablesTab A={A} onMarkPaid={markPaid} />}
      {tab === 'deposits' && <DepositsTab A={A} />}
      {tab === 'vehicles' && <VehiclesTab A={A} period={period} />}
      {tab === 'reports' && <ReportsTab A={A} period={period} />}

      {isModalOpen && <ExpenseModal vehicles={vehicles} onClose={() => setIsModalOpen(false)} onSave={handleSaveExpense} />}
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Acc = any

/* ============================ KPI ============================ */
function Kpi({ label, value, icon, tone, extra, onClick }: {
  label: string; value: number; icon: React.ReactNode; tone: 'emerald' | 'accent' | 'rose' | 'neutral'; extra?: string; onClick?: () => void
}) {
  return (
    <div className={clsx('stat-card', onClick ? 'card-hover cursor-pointer' : 'card-hover')} onClick={onClick}>
      <div className="flex items-center justify-between mb-2.5">
        <span className={clsx('icon-soft w-10 h-10', tone === 'accent' ? 'icon-soft-accent' : `icon-soft-${tone}`)}>{icon}</span>
        {onClick && <ChevronRight className="w-4 h-4 text-[var(--ink-subtle)]" />}
      </div>
      <p className="eyebrow mb-1.5">{label}</p>
      <p className="text-[24px] leading-none font-bold tracking-tight text-[var(--ink)]"><CountUp value={value} format={fmt} /></p>
      {extra && <p className="text-[11.5px] text-[var(--ink-muted)] mt-1.5">{extra}</p>}
    </div>
  )
}

/* ============================ Overview ============================ */
function OverviewTab({ A }: { A: Acc }) {
  return (
    <div className="flex flex-col gap-4 fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cash-flow chart */}
        <section className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <span className="icon-soft icon-soft-ink w-10 h-10"><BarChart3 className="w-[18px] h-[18px]" /></span>
            <div><h2 className="text-[14px] font-semibold text-[var(--ink-2)]">Движение средств</h2><p className="text-[11.5px] text-[var(--ink-subtle)]">Приход vs расход за период</p></div>
            <div className="ml-auto flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Приход</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />Расход</span>
            </div>
          </div>
          <CashflowChart data={A.cashflow} />
        </section>

        {/* Payment split */}
        <section className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="icon-soft icon-soft-ink w-10 h-10"><Coins className="w-[18px] h-[18px]" /></span>
            <div><h2 className="text-[14px] font-semibold text-[var(--ink-2)]">Способы оплаты</h2><p className="text-[11.5px] text-[var(--ink-subtle)]">Полученные средства</p></div>
          </div>
          <SplitBars split={A.split} />
        </section>
      </div>

      {/* Expense breakdown + quick P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="card p-5">
          <h2 className="text-[14px] font-semibold text-[var(--ink-2)] mb-4">Структура расходов</h2>
          {A.expenseBreakdown.length === 0 ? <EmptyMini text="Нет расходов за период" /> : (
            <div className="space-y-3">
              {A.expenseBreakdown.map((c: Acc) => {
                const max = A.expenseBreakdown[0].value || 1
                return (
                  <div key={c.key}>
                    <div className="flex items-center justify-between text-[13px] mb-1">
                      <span className="text-[var(--ink-2)]">{c.label}</span>
                      <span className="font-semibold text-[var(--ink)] num-roll">{fmt(c.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                      <div className="h-full rounded-full spark-grow" style={{ width: `${(c.value / max) * 100}%`, background: 'linear-gradient(90deg, var(--accent-strong), var(--accent-bright))' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-[14px] font-semibold text-[var(--ink-2)] mb-4">Сводка за период</h2>
          <div className="divide-y divide-[var(--border)]">
            <PnlRow label="Выручка" value={A.revenue} />
            <PnlRow label="— Получено" value={A.received} muted />
            <PnlRow label="— Ожидается" value={A.revenue - A.received} muted />
            <PnlRow label="Расходы (операционные)" value={-A.expensesSum} />
            <PnlRow label="Обслуживание / ТО" value={-A.maintSum} />
            <PnlRow label="Чистая прибыль" value={A.profit} strong />
          </div>
        </section>
      </div>
    </div>
  )
}

function PnlRow({ label, value, muted, strong }: { label: string; value: number; muted?: boolean; strong?: boolean }) {
  return (
    <div className={clsx('flex items-center justify-between py-2.5', strong && 'pt-3')}>
      <span className={clsx(strong ? 'text-[14px] font-semibold text-[var(--ink)]' : muted ? 'text-[12.5px] text-[var(--ink-muted)] pl-3' : 'text-[13px] text-[var(--ink-2)]')}>{label}</span>
      <span className={clsx('num-roll', strong ? 'text-[16px] font-bold' : muted ? 'text-[12.5px] text-[var(--ink-muted)]' : 'text-[13.5px] font-semibold text-[var(--ink)]')}
        style={strong ? { color: value >= 0 ? 'var(--accent)' : '#ef4444' } : undefined}>{fmt(value)}</span>
    </div>
  )
}

function CashflowChart({ data }: { data: { k: string; income: number; expense: number }[] }) {
  if (data.length === 0) return <EmptyMini text="Нет операций за период" />
  const max = Math.max(1, ...data.map(d => Math.max(d.income, d.expense)))
  const label = (k: string) => k.length === 7 ? new Date(k + '-01').toLocaleDateString('ru-RU', { month: 'short' }) : new Date(k).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  const shown = data.slice(-24)
  return (
    <div className="flex items-end gap-2 h-[200px] overflow-x-auto pb-1">
      {shown.map((d, i) => (
        <div key={d.k} className="flex-1 min-w-[26px] flex flex-col items-center gap-1.5 group">
          <div className="flex items-end gap-1 h-[170px] w-full justify-center">
            <div className="w-[42%] rounded-t-md bg-emerald-500/90 relative spark-bar-grow" style={{ height: `${(d.income / max) * 100}%`, minHeight: d.income > 0 ? 3 : 0, animationDelay: `${i * 25}ms` }} title={`Приход: ${fmt(d.income)}`} />
            <div className="w-[42%] rounded-t-md relative spark-bar-grow" style={{ height: `${(d.expense / max) * 100}%`, minHeight: d.expense > 0 ? 3 : 0, background: '#ef4444', animationDelay: `${i * 25 + 60}ms` }} title={`Расход: ${fmt(d.expense)}`} />
          </div>
          <span className="text-[9.5px] text-[var(--ink-subtle)] whitespace-nowrap">{label(d.k)}</span>
        </div>
      ))}
    </div>
  )
}

function SplitBars({ split }: { split: Record<PaymentMethod, number> }) {
  const total = (Object.values(split) as number[]).reduce((s, v) => s + v, 0)
  const methods: PaymentMethod[] = ['cash', 'card', 'transfer']
  if (total === 0) return <EmptyMini text="Нет полученных оплат" />
  return (
    <div className="space-y-3.5">
      {methods.map(m => {
        const v = split[m] || 0
        const pct = total > 0 ? (v / total) * 100 : 0
        return (
          <div key={m}>
            <div className="flex items-center justify-between text-[13px] mb-1.5">
              <span className="flex items-center gap-2 text-[var(--ink-2)]"><span className="icon-soft icon-soft-neutral w-6 h-6">{methodIcon[m]}</span>{methodLabels[m]}</span>
              <span className="font-semibold text-[var(--ink)] num-roll">{fmt(v)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
              <div className="h-full rounded-full spark-grow" style={{ width: `${pct}%`, background: 'var(--ink)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ============================ Ledger ============================ */
function LedgerTab({ A, period }: { A: Acc; period: { from: string; to: string } }) {
  const [kind, setKind] = useState<'all' | 'income' | 'expense' | 'deposit'>('all')
  const rows = (A.txns as Acc[]).filter(t =>
    kind === 'all' ? true : kind === 'deposit' ? t.kind.startsWith('deposit') : t.kind === kind
  ).slice().reverse()

  const totalIn = (A.txns as Acc[]).filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalOut = (A.txns as Acc[]).filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)

  const exportCsv = () => {
    const data: (string | number)[][] = [['Дата', 'Тип', 'Описание', 'Клиент/Заметка', 'Авто', 'Способ', 'Сумма', 'Баланс']]
    ;[...(A.txns as Acc[])].reverse().forEach(t => data.push([t.date, kindLabel(t.kind), t.title, t.sub, t.vehicle, t.method ? methodLabels[t.method as PaymentMethod] : '', Math.round(t.amount), Math.round(t.balance)]))
    downloadCSV(`ledger_${period.from}_${period.to}.csv`, data)
  }

  return (
    <div className="flex flex-col gap-3 fade-up">
      <div className="flex items-center justify-between gap-3 flex-wrap no-print">
        <div className="segment">
          {(['all', 'income', 'expense', 'deposit'] as const).map(k => (
            <button key={k} onClick={() => setKind(k)} className={clsx('segment-item', kind === k && 'is-active')}>
              {k === 'all' ? 'Все' : k === 'income' ? 'Приход' : k === 'expense' ? 'Расход' : 'Депозиты'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[var(--ink-muted)]">+{fmtNum(totalIn)} / {fmtNum(totalOut)} ฿</span>
          <button onClick={exportCsv} className="btn-secondary !py-2 text-[12.5px]"><FileSpreadsheet className="w-4 h-4" /> CSV</button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr>
            <th>Дата</th><th>Операция</th><th className="hidden md:table-cell">Авто</th><th className="hidden lg:table-cell">Способ</th><th className="text-right">Сумма</th><th className="text-right hidden sm:table-cell">Баланс</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6}><EmptyMini text="Нет операций за период" /></td></tr>
            ) : rows.map((t: Acc) => (
              <tr key={t.id}>
                <td className="text-[var(--ink-muted)] whitespace-nowrap">{fmtDate(t.date)}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <span className={clsx('icon-soft w-8 h-8', t.kind === 'income' ? 'icon-soft-emerald' : t.kind === 'expense' ? 'icon-soft-rose' : 'icon-soft-neutral')}>
                      {t.kind === 'income' ? <ArrowUpRight className="w-4 h-4" /> : t.kind === 'expense' ? <ArrowDownRight className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[var(--ink)] flex items-center gap-2">{t.title}
                        {t.status && t.status !== 'paid' && <span className={clsx('pill', t.status === 'partial' ? 'pill-warning' : 'pill-danger')}>{t.status === 'partial' ? 'частично' : 'не оплачено'}</span>}
                      </p>
                      {t.sub && <p className="text-[11px] text-[var(--ink-subtle)] truncate max-w-[260px]">{t.sub}</p>}
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell text-[var(--ink-muted)] text-[12.5px]">{t.vehicle}</td>
                <td className="hidden lg:table-cell">{t.method && <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)]">{methodIcon[t.method as PaymentMethod]}{methodLabels[t.method as PaymentMethod]}</span>}</td>
                <td className="text-right num-roll font-semibold" style={{ color: t.amount >= 0 ? '#059669' : '#dc2626' }}>{t.amount >= 0 ? '+' : '−'}{fmt(Math.abs(t.amount)).replace('฿', '฿')}</td>
                <td className="text-right num-roll text-[var(--ink-muted)] hidden sm:table-cell">{fmt(t.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
function kindLabel(k: string) { return k === 'income' ? 'Приход' : k === 'expense' ? 'Расход' : k === 'deposit_in' ? 'Депозит +' : 'Депозит −' }

/* ============================ Receivables ============================ */
function ReceivablesTab({ A, onMarkPaid }: { A: Acc; onMarkPaid: (r: Rental) => void }) {
  const list = A.receivablesList as Rental[]
  const now = Date.now()
  const overdueSum = list.filter(r => new Date(r.plannedEndDate).getTime() < now).reduce((s, r) => s + (r.totalAmount || 0), 0)
  const exportCsv = () => {
    const data: (string | number)[][] = [['Аренда', 'Клиент', 'Авто', 'Конец', 'Статус оплаты', 'Сумма']]
    list.forEach(r => data.push([`#${r.id}`, r.client?.fullName || '', r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : '', fmtDate(r.plannedEndDate), r.paymentStatus, Math.round(r.totalAmount || 0)]))
    downloadCSV('receivables.csv', data)
  }
  const confirmPaid = (r: Rental) => { if (confirm(`Отметить аренду #${r.id} как оплаченную (${fmt(r.totalAmount || 0)})?`)) onMarkPaid(r) }
  return (
    <div className="flex flex-col gap-3 fade-up">
      {/* Summary — neutral surface with a red accent stripe (no harsh fill) */}
      <div className="card stripe-l p-4 flex items-center gap-3" style={{ ['--stripe' as string]: '#ef4444' }}>
        <span className="icon-soft icon-soft-rose w-11 h-11"><ReceiptText className="w-[20px] h-[20px]" /></span>
        <div className="flex-1">
          <p className="eyebrow mb-0.5">Итого к получению</p>
          <p className="text-[26px] font-bold tracking-tight text-[var(--ink)] leading-none"><CountUp value={A.receivables} format={fmt} /></p>
        </div>
        {overdueSum > 0 && (
          <div className="hidden sm:block text-right mr-2">
            <p className="text-[11px] text-[var(--ink-subtle)]">просрочено</p>
            <p className="text-[15px] font-bold" style={{ color: '#dc2626' }}>{fmt(overdueSum)}</p>
          </div>
        )}
        <button onClick={exportCsv} className="btn-secondary !py-2 text-[12.5px] no-print"><FileSpreadsheet className="w-4 h-4" /> CSV</button>
      </div>
      {list.length === 0 ? <div className="card p-12 text-center"><span className="icon-soft icon-soft-emerald w-16 h-16 mx-auto mb-4 breathe"><ShieldCheck className="w-8 h-8" /></span><p className="text-[var(--ink-2)] font-medium">Долгов нет — всё оплачено 🎉</p></div> : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Клиент</th><th className="hidden md:table-cell">Авто</th><th>Срок</th><th>Оплата</th><th className="text-right">Сумма</th><th className="w-px no-print"></th></tr></thead>
            <tbody>
              {list.map(r => {
                const overdue = new Date(r.plannedEndDate).getTime() < now
                return (
                  <tr key={r.id}>
                    <td><p className="font-medium text-[var(--ink)]">{r.client?.fullName || '—'}</p><p className="text-[11px] font-mono text-[var(--ink-subtle)]">#{r.id}</p></td>
                    <td className="hidden md:table-cell text-[var(--ink-muted)] text-[12.5px]">{r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : '—'}</td>
                    <td><span className={clsx('inline-flex items-center gap-1.5 text-[12.5px]', overdue ? 'text-red-500 font-medium' : 'text-[var(--ink-muted)]')}>{overdue && <AlertCircle className="w-3.5 h-3.5" />}{fmtDate(r.plannedEndDate)}{overdue && ' · просрочена'}</span></td>
                    <td><span className={clsx('pill', r.paymentStatus === 'partial' ? 'pill-warning' : 'pill-danger')}>{r.paymentStatus === 'partial' ? 'частично' : 'не оплачено'}</span></td>
                    <td className="text-right num-roll font-bold text-[var(--ink)]">{fmt(r.totalAmount || 0)}</td>
                    <td className="no-print"><button onClick={() => confirmPaid(r)} className="btn-secondary !py-1.5 !px-3 text-[12px] whitespace-nowrap hover:!border-emerald-300 hover:!text-emerald-600"><ShieldCheck className="w-3.5 h-3.5" /> Оплачено</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ============================ Deposits ============================ */
function DepositsTab({ A }: { A: Acc }) {
  return (
    <div className="flex flex-col gap-4 fade-up">
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card"><span className="icon-soft icon-soft-amber w-10 h-10 mb-2.5"><ShieldCheck className="w-[18px] h-[18px]" /></span><p className="eyebrow mb-1.5">В залоге сейчас</p><p className="text-[24px] font-bold tracking-tight text-[var(--ink)]"><CountUp value={A.depositsHeld} format={fmt} /></p><p className="text-[11.5px] text-[var(--ink-muted)] mt-1.5">{A.heldList.length} активных аренд</p></div>
        <div className="stat-card"><span className="icon-soft icon-soft-emerald w-10 h-10 mb-2.5"><ArrowDownRight className="w-[18px] h-[18px]" /></span><p className="eyebrow mb-1.5">Возвращено</p><p className="text-[24px] font-bold tracking-tight text-[var(--ink)]"><CountUp value={A.depositsReturned} format={fmt} /></p></div>
      </div>
      {A.heldList.length === 0 ? <div className="card p-10 text-center"><p className="text-[var(--ink-subtle)] text-[13px]">Нет удерживаемых депозитов</p></div> : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Клиент</th><th className="hidden md:table-cell">Авто</th><th>Статус аренды</th><th className="text-right">Депозит</th></tr></thead>
            <tbody>
              {(A.heldList as Rental[]).map(r => (
                <tr key={r.id}>
                  <td><p className="font-medium text-[var(--ink)]">{r.client?.fullName || '—'}</p><p className="text-[11px] font-mono text-[var(--ink-subtle)]">#{r.id}</p></td>
                  <td className="hidden md:table-cell text-[var(--ink-muted)] text-[12.5px]">{r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : '—'}</td>
                  <td><span className={clsx('pill', r.status === 'overdue' ? 'pill-warning' : 'pill-info')}>{r.status === 'overdue' ? 'просрочена' : 'активна'}</span></td>
                  <td className="text-right num-roll font-bold text-[var(--ink)]">{fmt(r.deposit || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ============================ Per-vehicle P&L ============================ */
function VehiclesTab({ A, period }: { A: Acc; period: { from: string; to: string } }) {
  const list = A.perVehicle as Acc[]
  const exportCsv = () => {
    const data: (string | number)[][] = [['Авто', 'Номер', 'Аренд', 'Выручка', 'Расходы', 'Прибыль', 'Маржа %']]
    list.forEach(x => data.push([`${x.v.brand} ${x.v.model}`, x.v.licensePlate, x.count, Math.round(x.rev), Math.round(x.exp), Math.round(x.profit), Math.round(x.margin)]))
    downloadCSV(`pnl_by_vehicle_${period.from}_${period.to}.csv`, data)
  }
  return (
    <div className="flex flex-col gap-3 fade-up">
      <div className="flex justify-end no-print"><button onClick={exportCsv} className="btn-secondary !py-2 text-[12.5px]"><FileSpreadsheet className="w-4 h-4" /> CSV</button></div>
      {list.length === 0 ? <div className="card p-12 text-center"><span className="icon-soft icon-soft-neutral w-16 h-16 mx-auto mb-4 breathe"><Car className="w-8 h-8" /></span><p className="text-[var(--ink-2)] font-medium">Нет данных за период</p></div> : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Автомобиль</th><th className="text-center hidden sm:table-cell">Аренд</th><th className="text-right">Выручка</th><th className="text-right hidden md:table-cell">Расходы</th><th className="text-right">Прибыль</th><th className="text-right hidden lg:table-cell">Маржа</th></tr></thead>
            <tbody>
              {list.map((x: Acc) => (
                <tr key={x.v.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="icon-soft icon-soft-neutral w-9 h-9"><Car className="w-[18px] h-[18px]" /></span>
                      <div><p className="font-medium text-[var(--ink)]">{x.v.brand} {x.v.model}</p><p className="text-[11px] font-mono text-[var(--ink-subtle)]">{x.v.licensePlate}</p></div>
                    </div>
                  </td>
                  <td className="text-center hidden sm:table-cell num-roll text-[var(--ink-muted)]">{x.count}</td>
                  <td className="text-right num-roll text-[var(--ink-2)]">{fmt(x.rev)}</td>
                  <td className="text-right num-roll text-[var(--ink-muted)] hidden md:table-cell">{fmt(x.exp)}</td>
                  <td className="text-right num-roll font-bold" style={{ color: x.profit >= 0 ? 'var(--accent)' : '#dc2626' }}>{fmt(x.profit)}</td>
                  <td className="text-right hidden lg:table-cell">
                    <span className={clsx('pill', x.margin >= 50 ? 'pill-success' : x.margin >= 0 ? 'pill-warning' : 'pill-danger')}>{Math.round(x.margin)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ============================ Reports ============================ */
function ReportsTab({ A, period }: { A: Acc; period: { from: string; to: string } }) {
  const exportPnl = () => {
    const data: (string | number)[][] = [
      ['Отчёт о прибылях и убытках'], [`Период: ${period.from} — ${period.to}`], [],
      ['Показатель', 'Сумма (฿)'],
      ['Выручка', Math.round(A.revenue)],
      ['  Получено', Math.round(A.received)],
      ['  Ожидается', Math.round(A.revenue - A.received)],
      ['Операционные расходы', Math.round(A.expensesSum)],
      ['Обслуживание / ТО', Math.round(A.maintSum)],
      ['Чистая прибыль', Math.round(A.profit)],
      [`Маржа, %`, Math.round(A.margin)],
      ['К получению (всего)', Math.round(A.receivables)],
      ['Депозиты в залоге', Math.round(A.depositsHeld)],
    ]
    downloadCSV(`pnl_${period.from}_${period.to}.csv`, data)
  }
  return (
    <div className="flex flex-col gap-3 fade-up">
      <div className="flex items-center justify-between gap-3 no-print">
        <h2 className="text-[14px] font-semibold text-[var(--ink-2)]">Отчёт о прибылях и убытках</h2>
        <div className="flex gap-2">
          <button onClick={exportPnl} className="btn-secondary !py-2 text-[12.5px]"><Download className="w-4 h-4" /> CSV</button>
          <button onClick={() => window.print()} className="btn-primary !py-2 text-[12.5px]"><Printer className="w-4 h-4" /> Печать</button>
        </div>
      </div>
      <section className="card p-6 print-area">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className="icon-soft icon-soft-ink w-11 h-11"><Wallet className="w-5 h-5" /></span>
            <div><h3 className="text-[17px] font-bold text-[var(--ink)]">P&L · UNICAR</h3><p className="text-[12px] text-[var(--ink-muted)]">{period.from} — {period.to}</p></div>
          </div>
        </div>
        <div className="max-w-xl divide-y divide-[var(--border)]">
          <PnlRow label="Выручка (начислено)" value={A.revenue} />
          <PnlRow label="— Получено" value={A.received} muted />
          <PnlRow label="— Ожидается к оплате" value={A.revenue - A.received} muted />
          <PnlRow label="Операционные расходы" value={-A.expensesSum} />
          <PnlRow label="Обслуживание / ТО" value={-A.maintSum} />
          <PnlRow label="Чистая прибыль" value={A.profit} strong />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <MiniStat label="Маржа" value={`${Math.round(A.margin)}%`} />
          <MiniStat label="Аренд" value={String(A.periodRentals.length)} />
          <MiniStat label="К получению" value={fmt(A.receivables)} />
          <MiniStat label="Депозиты" value={fmt(A.depositsHeld)} />
        </div>
      </section>
    </div>
  )
}
function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2.5"><p className="text-[10px] uppercase tracking-wide text-[var(--ink-subtle)]">{label}</p><p className="text-[15px] font-bold text-[var(--ink)] num-roll mt-0.5">{value}</p></div>
}

function EmptyMini({ text }: { text: string }) {
  return <div className="py-10 text-center"><p className="text-[13px] text-[var(--ink-subtle)]">{text}</p></div>
}

/* ============================ Expense modal ============================ */
function ExpenseModal({ vehicles, onClose, onSave }: { vehicles: Vehicle[]; onClose: () => void; onSave: (data: ExpenseFormData) => void }) {
  const [formData, setFormData] = useState<ExpenseFormData>({ category: 'maintenance', amount: 0, date: isoToday(), description: '' })
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData) }
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-overlay" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="modal-content w-full max-w-md">
          <div className="modal-header flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="icon-soft icon-soft-rose w-10 h-10"><ReceiptText className="w-[18px] h-[18px]" /></span>
              <h2 className="modal-header-title">Добавить расход</h2>
            </div>
            <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <SelectDropdown label="Категория" required value={formData.category} onChange={(v) => setFormData({ ...formData, category: v as ExpenseCategory })} options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))} />
              <DatePicker label="Дата" value={formData.date} onChange={(v) => setFormData({ ...formData, date: v })} />
            </div>
            <SelectDropdown label="Автомобиль" value={formData.vehicleId?.toString() ?? ''} onChange={(v) => setFormData({ ...formData, vehicleId: v ? parseInt(v) : undefined })}
              options={[{ value: '', label: 'Без автомобиля' }, ...vehicles.map(v => ({ value: v.id.toString(), label: `${v.brand} ${v.model} (${v.licensePlate})` }))]} placeholder="Выберите автомобиль" />
            <div><label className="form-label">Сумма *</label><input type="number" required min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })} className="input" /></div>
            <div><label className="form-label">Описание *</label><textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="input" /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Отмена</button>
              <button type="submit" className="btn-primary flex-1">Добавить</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
