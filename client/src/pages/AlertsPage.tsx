import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useAlerts, GROUP_LABELS, type AlertGroup, type AlertItem } from '@/hooks/useAlerts'
import {
  AlertTriangle, CalendarClock, ReceiptText, ShieldAlert, ClipboardCheck, IdCard, Wrench,
  BellRing, CheckCircle2, ChevronRight, Car, CreditCard, FileWarning,
} from 'lucide-react'

const ICONS: Record<string, React.FC<{ className?: string }>> = {
  AlertTriangle, CalendarClock, ReceiptText, ShieldAlert, ClipboardCheck, IdCard, Wrench,
}
const GROUP_ICON: Record<AlertGroup, React.FC<{ className?: string }>> = {
  rentals: Car, payments: CreditCard, documents: FileWarning, maintenance: Wrench,
}
const sevTone = (s: AlertItem['severity']) => s === 'danger' ? 'rose' : s === 'warning' ? 'amber' : 'blue'

export default function AlertsPage() {
  const navigate = useNavigate()
  const { alerts, dangerCount, isLoading } = useAlerts()

  const order: AlertGroup[] = ['rentals', 'payments', 'documents', 'maintenance']
  const grouped = order.map(g => ({ g, items: alerts.filter(a => a.group === g) })).filter(x => x.items.length > 0)

  const counts = {
    danger: alerts.filter(a => a.severity === 'danger').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-[100px] rounded-[18px] skeleton" />)}</div>
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-[72px] rounded-2xl skeleton" />)}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-end justify-between gap-4 fade-up">
        <div>
          <p className="eyebrow mb-1.5">Автоматика</p>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[var(--ink)] leading-none">Уведомления</h1>
            {alerts.length > 0
              ? <span className={clsx('pill', dangerCount > 0 ? 'pill-danger' : 'pill-warning')}>{alerts.length}</span>
              : <span className="pill pill-success">всё в порядке</span>}
          </div>
        </div>
      </header>

      {/* Severity summary */}
      <div className="grid grid-cols-3 gap-3 stagger-animation">
        <SevCard label="Срочно" value={counts.danger} tone="rose" icon={<AlertTriangle className="w-[18px] h-[18px]" />} />
        <SevCard label="Внимание" value={counts.warning} tone="amber" icon={<BellRing className="w-[18px] h-[18px]" />} />
        <SevCard label="Информация" value={counts.info} tone="blue" icon={<CalendarClock className="w-[18px] h-[18px]" />} />
      </div>

      {/* Empty */}
      {alerts.length === 0 ? (
        <div className="card p-14 text-center fade-up">
          <span className="icon-soft icon-soft-emerald w-16 h-16 mx-auto mb-4 breathe"><CheckCircle2 className="w-8 h-8" /></span>
          <p className="text-[var(--ink-2)] font-medium">Нет активных уведомлений</p>
          <p className="text-[13px] text-[var(--ink-subtle)] mt-1">Возвраты, оплаты и документы под контролем</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map(({ g, items }) => {
            const GIcon = GROUP_ICON[g]
            return (
              <section key={g} className="fade-up">
                <h2 className="text-[14px] font-semibold text-[var(--ink-2)] mb-3 flex items-center gap-2.5">
                  <span className="icon-soft icon-soft-ink w-8 h-8"><GIcon className="w-[17px] h-[17px]" /></span>
                  {GROUP_LABELS[g]}
                  <span className="pill pill-neutral">{items.length}</span>
                </h2>
                <div className="space-y-2 stagger-animation">
                  {items.map(a => {
                    const Icon = ICONS[a.icon] || AlertTriangle
                    return (
                      <button
                        key={a.id}
                        onClick={() => navigate(a.link)}
                        className={clsx('card card-hover w-full p-3.5 flex items-center gap-3 text-left stripe-l')}
                        style={{ ['--stripe' as string]: a.severity === 'danger' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#3b82f6' }}
                      >
                        <span className={clsx('icon-soft w-10 h-10', `icon-soft-${sevTone(a.severity)}`)}><Icon className="w-[19px] h-[19px]" /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-medium text-[var(--ink)] truncate">{a.title}</p>
                          <p className="text-[12px] text-[var(--ink-muted)] truncate">{a.detail}</p>
                        </div>
                        {a.amount !== undefined && a.amount > 0 && (
                          <span className="text-[13.5px] font-bold text-[var(--ink)] num-roll whitespace-nowrap">฿{a.amount.toLocaleString('ru-RU')}</span>
                        )}
                        <ChevronRight className="w-4 h-4 text-[var(--ink-subtle)] shrink-0" />
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SevCard({ label, value, tone, icon }: { label: string; value: number; tone: 'rose' | 'amber' | 'blue'; icon: React.ReactNode }) {
  return (
    <div className="stat-card">
      <span className={clsx('icon-soft w-9 h-9 mb-2.5', `icon-soft-${tone}`)}>{icon}</span>
      <p className="eyebrow mb-1">{label}</p>
      <p className="text-[26px] leading-none font-bold tracking-tight text-[var(--ink)]">{value}</p>
    </div>
  )
}
