import { useState } from 'react'
import type { Rental } from '@/types'
import clsx from 'clsx'
import { X, Printer, FileText, ClipboardCheck, ReceiptText } from 'lucide-react'

type DocType = 'contract' | 'act' | 'invoice'
const DOCS: { key: DocType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'contract', label: 'Договор', icon: FileText },
  { key: 'act', label: 'Акт приёма-передачи', icon: ClipboardCheck },
  { key: 'invoice', label: 'Счёт', icon: ReceiptText },
]

const num = (x: unknown) => Number(x) || 0
const fmt = (n: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n)
const d = (s?: string | null) => s ? new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
const rateLabel: Record<string, string> = { hourly: 'час', daily: 'сутки', '3days': '3 дня', '7days': 'неделя', monthly: 'месяц' }

export default function RentalDocument({ rental, onClose }: { rental: Rental; onClose: () => void }) {
  const [type, setType] = useState<DocType>('contract')
  const v = rental.vehicle
  const c = rental.client

  const print = () => {
    document.body.classList.add('printing-doc')
    const after = () => { document.body.classList.remove('printing-doc'); window.removeEventListener('afterprint', after) }
    window.addEventListener('afterprint', after)
    window.print()
    setTimeout(() => document.body.classList.remove('printing-doc'), 1500)
  }

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between gap-4 py-1.5 border-b border-dashed border-gray-200">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value || '—'}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto">
      <div className="modal-overlay no-print" onClick={onClose} />
      <div className="relative min-h-full flex flex-col items-center p-4 sm:p-8">
        {/* toolbar */}
        <div className="no-print w-full max-w-[800px] flex items-center justify-between mb-3">
          <div className="segment">
            {DOCS.map(doc => (
              <button key={doc.key} onClick={() => setType(doc.key)} className={clsx('segment-item', type === doc.key && 'is-active')}>
                <doc.icon className="w-3.5 h-3.5" />{doc.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={print} className="btn-primary !py-2 text-[13px]"><Printer className="w-4 h-4" /> Печать / PDF</button>
            <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* A4 document */}
        <div className="print-doc bg-white text-gray-900 w-full max-w-[800px] rounded-2xl shadow-2xl p-10 sm:p-14 text-[13px] leading-relaxed" style={{ minHeight: '60vh' }}>
          {/* Letterhead */}
          <div className="flex items-start justify-between pb-5 border-b-2 border-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center text-[22px] font-bold">U</div>
              <div>
                <p className="text-[18px] font-bold tracking-tight">UNICAR</p>
                <p className="text-[11px] text-gray-500">Аренда транспортных средств · Пхукет, Таиланд</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">{type === 'contract' ? 'Договор аренды' : type === 'act' ? 'Акт приёма-передачи' : 'Счёт на оплату'}</p>
              <p className="text-[16px] font-bold">№ {rental.id}</p>
              <p className="text-[11px] text-gray-500">от {d(rental.createdAt || rental.startDate)}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-8 mt-6">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">Арендодатель</p>
              <p className="font-semibold">UNICAR Co., Ltd.</p>
              <p className="text-gray-600">Phuket, Thailand</p>
              <p className="text-gray-600">+66 00 000 0000</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">Арендатор</p>
              <p className="font-semibold">{c?.fullName || '—'}</p>
              <p className="text-gray-600">Тел.: {c?.phone || '—'}</p>
              <p className="text-gray-600">ВУ: {c?.licenseNumber || '—'}</p>
              <p className="text-gray-600">Паспорт: {c?.passport || '—'}</p>
            </div>
          </div>

          {/* Vehicle */}
          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">Транспортное средство</p>
            <div className="grid grid-cols-2 gap-x-10">
              <Row label="Марка / модель" value={v ? `${v.brand} ${v.model}` : '—'} />
              <Row label="Гос. номер" value={v?.licensePlate} />
              <Row label="Год / цвет" value={v ? `${v.year} · ${v.color}` : '—'} />
              <Row label="VIN" value={v?.vin} />
            </div>
          </div>

          {/* Body by type */}
          {type === 'contract' && (
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">Условия аренды</p>
              <div className="grid grid-cols-2 gap-x-10">
                <Row label="Начало" value={d(rental.startDate)} />
                <Row label="Окончание (план)" value={d(rental.plannedEndDate)} />
                <Row label="Тариф" value={`${fmt(num(rental.rateAmount))} / ${rateLabel[rental.rateType] || rental.rateType}`} />
                <Row label="Депозит" value={fmt(num(rental.deposit))} />
                <Row label="Способ оплаты" value={rental.paymentMethod === 'cash' ? 'Наличные' : rental.paymentMethod === 'card' ? 'Карта' : 'Перевод'} />
                <Row label="Пробег при выдаче" value={`${rental.mileageStart?.toLocaleString('ru-RU') || 0} км`} />
              </div>
              <p className="mt-5 text-[12px] text-gray-600">Арендатор обязуется вернуть ТС в указанный срок в исправном состоянии, с тем же уровнем топлива. Депозит возвращается после осмотра ТС при отсутствии повреждений и штрафов.</p>
            </div>
          )}

          {type === 'act' && (
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">Передача автомобиля</p>
              <div className="grid grid-cols-2 gap-x-10">
                <Row label="Дата выдачи" value={d(rental.startDate)} />
                <Row label="Дата возврата" value={d(rental.actualEndDate || rental.plannedEndDate)} />
                <Row label="Пробег: выдача" value={`${rental.mileageStart?.toLocaleString('ru-RU') || 0} км`} />
                <Row label="Пробег: возврат" value={rental.mileageEnd ? `${rental.mileageEnd.toLocaleString('ru-RU')} км` : '—'} />
                <Row label="Топливо: выдача" value={`${rental.fuelLevelStart ?? 100}%`} />
                <Row label="Топливо: возврат" value={rental.fuelLevelEnd != null ? `${rental.fuelLevelEnd}%` : '—'} />
              </div>
              <Row label="Состояние при выдаче" value={rental.conditionStart} />
              <Row label="Состояние при возврате" value={rental.conditionEnd} />
            </div>
          )}

          {type === 'invoice' && (
            <div className="mt-6">
              <table className="w-full text-[13px]">
                <thead><tr className="border-b border-gray-300 text-left text-gray-500"><th className="py-2 font-medium">Описание</th><th className="py-2 font-medium text-right">Сумма</th></tr></thead>
                <tbody>
                  <tr className="border-b border-dashed border-gray-200"><td className="py-2">Аренда {v ? `${v.brand} ${v.model}` : ''} ({d(rental.startDate)} — {d(rental.plannedEndDate)})</td><td className="py-2 text-right font-medium">{fmt(num(rental.totalAmount))}</td></tr>
                  <tr className="border-b border-dashed border-gray-200"><td className="py-2 text-gray-500">Депозит (возвратный)</td><td className="py-2 text-right text-gray-500">{fmt(num(rental.deposit))}</td></tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-900"><td className="py-3 font-bold text-[15px]">Итого к оплате</td><td className="py-3 text-right font-bold text-[15px]">{fmt(num(rental.totalAmount))}</td></tr>
                </tfoot>
              </table>
              <p className="mt-4 text-[12px]">Статус оплаты: <span className={clsx('font-semibold', rental.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-red-600')}>{rental.paymentStatus === 'paid' ? 'Оплачено' : rental.paymentStatus === 'partial' ? 'Частично' : 'Не оплачено'}</span></p>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-10 mt-12 pt-6">
            <div><div className="border-t border-gray-400 pt-1.5 text-[11px] text-gray-500">Арендодатель · UNICAR</div></div>
            <div><div className="border-t border-gray-400 pt-1.5 text-[11px] text-gray-500">Арендатор · {c?.fullName || ''}</div></div>
          </div>
        </div>
      </div>
    </div>
  )
}
