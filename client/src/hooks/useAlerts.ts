import { useState, useEffect, useCallback } from 'react'
import type { Vehicle, Rental, Client, Maintenance } from '@/types'

export type AlertSeverity = 'danger' | 'warning' | 'info'
export type AlertGroup = 'rentals' | 'payments' | 'documents' | 'maintenance'

export interface AlertItem {
  id: string
  severity: AlertSeverity
  group: AlertGroup
  icon: string // lucide name
  title: string
  detail: string
  link: string
  amount?: number
  days?: number
}

export const GROUP_LABELS: Record<AlertGroup, string> = {
  rentals: 'Аренды и возвраты',
  payments: 'Оплаты и долги',
  documents: 'Документы',
  maintenance: 'Обслуживание',
}

const SEV_RANK: Record<AlertSeverity, number> = { danger: 0, warning: 1, info: 2 }
const num = (x: unknown) => Number(x) || 0

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

export function computeAlerts(vehicles: Vehicle[], rentals: Rental[], clients: Client[], maintenance: Maintenance[]): AlertItem[] {
  const out: AlertItem[] = []
  const live = rentals.filter(r => r.status !== 'cancelled' && r.status !== 'completed')

  // --- Rentals: overdue / returns due ---
  live.forEach(r => {
    const veh = r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : `Аренда #${r.id}`
    const who = r.client?.fullName || ''
    const d = daysUntil(r.plannedEndDate)
    if (d === null) return
    if (d < 0) out.push({ id: `ov${r.id}`, severity: 'danger', group: 'rentals', icon: 'AlertTriangle', title: `Просрочен возврат · ${veh}`, detail: `${who} · срок истёк ${Math.abs(d)} дн. назад`, link: '/rentals', days: d })
    else if (d === 0) out.push({ id: `rt${r.id}`, severity: 'warning', group: 'rentals', icon: 'CalendarClock', title: `Возврат сегодня · ${veh}`, detail: who, link: '/rentals', days: 0 })
    else if (d <= 2) out.push({ id: `rs${r.id}`, severity: 'info', group: 'rentals', icon: 'CalendarClock', title: `Возврат через ${d} дн. · ${veh}`, detail: who, link: '/rentals', days: d })
  })

  // --- Payments: unpaid / partial ---
  live.forEach(r => {
    if (r.paymentStatus === 'paid' || num(r.totalAmount) <= 0) return
    const veh = r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : `Аренда #${r.id}`
    out.push({ id: `pay${r.id}`, severity: 'warning', group: 'payments', icon: 'ReceiptText', title: `${r.paymentStatus === 'partial' ? 'Частичная оплата' : 'Не оплачено'} · ${veh}`, detail: r.client?.fullName || '', link: '/finances', amount: num(r.totalAmount) })
  })

  // --- Documents: vehicle insurance / inspection ---
  vehicles.filter(v => v.status !== 'archived').forEach(v => {
    const name = `${v.brand} ${v.model} · ${v.licensePlate}`
    const ins = daysUntil(v.insuranceExpiry)
    if (ins !== null && ins <= 30) out.push({ id: `ins${v.id}`, severity: ins < 0 ? 'danger' : 'warning', group: 'documents', icon: 'ShieldAlert', title: `Страховка ${ins < 0 ? 'истекла' : `истекает (${ins} дн.)`} · ${name}`, detail: ins < 0 ? 'требуется продление' : 'скоро продление', link: '/vehicles', days: ins })
    const insp = daysUntil(v.inspectionExpiry)
    if (insp !== null && insp <= 30) out.push({ id: `insp${v.id}`, severity: insp < 0 ? 'danger' : 'warning', group: 'documents', icon: 'ClipboardCheck', title: `Техосмотр ${insp < 0 ? 'истёк' : `истекает (${insp} дн.)`} · ${name}`, detail: insp < 0 ? 'требуется ТО' : 'скоро ТО', link: '/vehicles', days: insp })
  })

  // --- Documents: client licenses ---
  clients.filter(c => c.status !== 'blacklisted').forEach(c => {
    const lic = daysUntil(c.licenseExpiry)
    if (lic !== null && lic <= 30) out.push({ id: `lic${c.id}`, severity: lic < 0 ? 'danger' : 'warning', group: 'documents', icon: 'IdCard', title: `ВУ ${lic < 0 ? 'истекло' : `истекает (${lic} дн.)`} · ${c.fullName}`, detail: c.phone || '', link: '/clients', days: lic })
  })

  // --- Maintenance due (by next maintenance date) ---
  const latestByVehicle = new Map<number, Maintenance>()
  maintenance.forEach(m => { const cur = latestByVehicle.get(m.vehicleId); if (!cur || m.date > cur.date) latestByVehicle.set(m.vehicleId, m) })
  latestByVehicle.forEach(m => {
    const d = daysUntil(m.nextMaintenanceDate)
    if (d !== null && d <= 14) {
      const v = vehicles.find(x => x.id === m.vehicleId)
      const name = v ? `${v.brand} ${v.model} · ${v.licensePlate}` : `Авто #${m.vehicleId}`
      out.push({ id: `mnt${m.id}`, severity: d < 0 ? 'danger' : 'info', group: 'maintenance', icon: 'Wrench', title: `ТО ${d < 0 ? 'просрочено' : `через ${d} дн.`} · ${name}`, detail: 'плановое обслуживание', link: '/maintenance', days: d })
    }
  })

  return out.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || (a.days ?? 99) - (b.days ?? 99))
}

export function useAlerts(pollMs = 60000) {
  const [data, setData] = useState<{ vehicles: Vehicle[]; rentals: Rental[]; clients: Client[]; maintenance: Maintenance[] }>({ vehicles: [], rentals: [], clients: [], maintenance: [] })
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [v, r, c, m] = await Promise.all([
        fetch('/api/vehicles'), fetch('/api/rentals'), fetch('/api/clients'), fetch('/api/maintenance'),
      ])
      setData({
        vehicles: v.ok ? await v.json() : [],
        rentals: r.ok ? await r.json() : [],
        clients: c.ok ? await c.json() : [],
        maintenance: m.ok ? await m.json() : [],
      })
    } catch (e) { console.error('alerts fetch failed', e) }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => {
    refresh()
    if (!pollMs) return
    const t = setInterval(refresh, pollMs)
    return () => clearInterval(t)
  }, [refresh, pollMs])

  const alerts = computeAlerts(data.vehicles, data.rentals, data.clients, data.maintenance)
  const count = alerts.length
  const dangerCount = alerts.filter(a => a.severity === 'danger').length
  return { alerts, count, dangerCount, isLoading, refresh }
}
