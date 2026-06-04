import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import NotificationsDropdown from './NotificationsDropdown'
import clsx from 'clsx'
import { useAlerts } from '@/hooks/useAlerts'
import CommandPalette from '@/components/CommandPalette'
import {
  Home, Car, KeyRound, Users, UsersRound, Wrench, BarChart3,
  Settings, Sun, Moon, LogOut, ChevronLeft, Inbox, Menu, Bell, CalendarDays, Search,
} from 'lucide-react'

const openPalette = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))

// Bottom navigation items for mobile
const bottomNav = [
  { name: 'Главная', href: '/dashboard', icon: HomeIcon },
  { name: 'Аренды', href: '/rentals', icon: KeyIcon },
  { name: 'Авто', href: '/vehicles', icon: CarIcon },
  { name: 'Клиенты', href: '/clients', icon: UsersIcon },
  { name: 'Ещё', href: '#more', icon: MoreIcon, isMore: true },
]

type NavItem = { name: string; href: string; icon: React.FC<{ className?: string }>; badge?: boolean; alerts?: boolean }

// Sidebar navigation
const sidebarNav: NavItem[] = [
  { name: 'Главная', href: '/dashboard', icon: HomeIcon },
  { name: 'Аренды', href: '/rentals', icon: KeyIcon, badge: true },
  { name: 'Календарь', href: '/calendar', icon: CalendarNavIcon },
  { name: 'Заявки', href: '/booking-requests', icon: InboxIcon },
  { name: 'Автомобили', href: '/vehicles', icon: CarIcon },
  { name: 'Клиенты', href: '/clients', icon: UsersIcon },
  { name: 'Обслуживание', href: '/maintenance', icon: WrenchIcon },
  { name: 'Финансы', href: '/finances', icon: ChartIcon },
  { name: 'Уведомления', href: '/alerts', icon: BellIcon, alerts: true },
]

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [activeRentalsCount, setActiveRentalsCount] = useState(0)
  const { count: alertCount, dangerCount } = useAlerts()
  const { logout, user, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  // Sliding active indicator for the dark sidebar nav
  const navListRef = useRef<HTMLUListElement>(null)
  const [navIndicator, setNavIndicator] = useState({ y: 0, h: 50, visible: false })

  // Fetch active rentals count
  useEffect(() => {
    const fetchActiveRentals = async () => {
      try {
        const response = await fetch('/api/rentals/active')
        if (response.ok) {
          const data = await response.json()
          setActiveRentalsCount(data.length)
        }
      } catch (error) {
        console.error('Failed to fetch active rentals:', error)
      }
    }
    fetchActiveRentals()
    const interval = setInterval(fetchActiveRentals, 30000)
    return () => clearInterval(interval)
  }, [location.pathname])

  // Measure & position the sliding active indicator after each route/layout change
  useLayoutEffect(() => {
    const list = navListRef.current
    if (!list) return
    const active = list.querySelector('.nav-item-dark.is-active') as HTMLElement | null
    if (!active) {
      setNavIndicator((s) => ({ ...s, visible: false }))
      return
    }
    setNavIndicator({ y: active.offsetTop, h: active.offsetHeight, visible: true })
  }, [location.pathname, sidebarCollapsed])

  // Close more menu on route change
  useEffect(() => {
    setMoreMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const todayLabel = new Date().toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })

  // Desktop sidebar item
  const SidebarItem = ({ item }: { item: NavItem }) => (
    <li>
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          clsx('nav-item-dark group', sidebarCollapsed && 'justify-center', isActive && 'is-active')
        }
      >
        <item.icon className="w-[19px] h-[19px] shrink-0" />

        {!sidebarCollapsed && <span className="flex-1 truncate">{item.name}</span>}

        {!sidebarCollapsed && item.badge && activeRentalsCount > 0 && (
          <span
            className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full"
            style={{ background: 'var(--accent-bright)', color: '#1a1205' }}
          >
            {activeRentalsCount}
          </span>
        )}

        {!sidebarCollapsed && item.alerts && alertCount > 0 && (
          <span
            className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full text-white"
            style={{ background: dangerCount > 0 ? '#ef4444' : 'var(--accent-bright)', color: dangerCount > 0 ? '#fff' : '#1a1205' }}
          >
            {alertCount}
          </span>
        )}
        {/* Collapsed: small dot indicator for alerts */}
        {sidebarCollapsed && item.alerts && alertCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: dangerCount > 0 ? '#ef4444' : 'var(--accent-bright)' }} />
        )}

        {/* Tooltip when collapsed */}
        {sidebarCollapsed && (
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white text-[var(--ink)] text-[11px] font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
            {item.name}
            {item.badge && activeRentalsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--accent-bright)', color: '#1a1205' }}>
                {activeRentalsCount}
              </span>
            )}
          </div>
        )}
      </NavLink>
    </li>
  )

  return (
    <div className="min-h-screen lg:h-screen lg:flex lg:p-3 lg:gap-3 pb-16 lg:pb-0">
      {/* Floating Dark Sidebar (desktop) */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col flex-shrink-0 relative z-20 sidebar-dark transition-[width] duration-300',
          sidebarCollapsed ? 'w-[88px]' : 'w-[268px]'
        )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Logo */}
        <div className={clsx('relative h-[80px] flex items-center', sidebarCollapsed ? 'justify-center px-3' : 'justify-between px-5')}>
          <div className={clsx('flex items-center min-w-0', !sidebarCollapsed && 'gap-3')}>
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-[18px]"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f4f0 100%)',
                color: '#0a0a0a',
                boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 0 0 1px rgba(255,255,255,0.12), 0 4px 12px -4px rgba(245, 158, 11, 0.3)',
              }}
            >
              U
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="text-[15px] font-semibold text-white tracking-tight leading-tight">UNICAR</h1>
                <p className="text-[11px] leading-tight tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Аренда транспорта</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              aria-label="Свернуть"
            >
              <ChevronIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="relative mx-auto mb-2 p-1.5 rounded-md transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            aria-label="Развернуть"
          >
            <ChevronIcon className="w-4 h-4 rotate-180" />
          </button>
        )}

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto scroll-refined px-3">
          {!sidebarCollapsed && (
            <p className="px-3 mt-3 mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Рабочая область
            </p>
          )}
          <ul ref={navListRef} className="sidebar-nav-list space-y-0.5">
            <span
              className="nav-active-indicator"
              aria-hidden="true"
              style={{
                transform: `translate3d(0, ${navIndicator.y}px, 0)`,
                height: `${navIndicator.h}px`,
                opacity: navIndicator.visible ? 1 : 0,
              }}
            />
            {sidebarNav.map((item) => (
              <SidebarItem key={item.href} item={item} />
            ))}
          </ul>
        </nav>

        {/* Bottom: settings / users */}
        <div className="relative px-3 pb-2 pt-3 mt-2 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) => clsx('nav-item-dark group', sidebarCollapsed && 'justify-center', isActive && 'is-active')}
            >
              <UserGroupIcon className="w-[19px] h-[19px] shrink-0" />
              {!sidebarCollapsed && <span className="truncate">Пользователи</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white text-[var(--ink)] text-[11px] font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                  Пользователи
                </div>
              )}
            </NavLink>
          )}
          <NavLink
            to="/settings"
            className={({ isActive }) => clsx('nav-item-dark group', sidebarCollapsed && 'justify-center', isActive && 'is-active')}
          >
            <CogIcon className="w-[19px] h-[19px] shrink-0 transition-transform duration-500 group-hover:rotate-45" />
            {!sidebarCollapsed && <span className="truncate">Настройки</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white text-[var(--ink)] text-[11px] font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                Настройки
              </div>
            )}
          </NavLink>
        </div>

        {/* User card */}
        <div
          className={clsx('relative m-3 mt-0 rounded-2xl', sidebarCollapsed ? 'p-2 flex justify-center' : 'p-3')}
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          {sidebarCollapsed ? (
            <div className="relative">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5f4f0 100%)', color: '#0a0a0a' }}
              >
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-0 -right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--dark-sidebar)]" style={{ background: 'var(--accent-bright)' }} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-semibold text-sm"
                  style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5f4f0 100%)', color: '#0a0a0a' }}
                >
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-0 -right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--dark-sidebar)]" style={{ background: 'var(--accent-bright)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-white truncate leading-tight">{user?.fullName || 'Пользователь'}</p>
                <p className="text-[11.5px] truncate leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{isAdmin ? 'Администратор' : 'Агент'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                aria-label="Выйти"
                title="Выйти"
              >
                <LogoutIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden">
        {/* Top bar — glass utilities */}
        <header className="h-[56px] lg:h-[60px] flex items-center justify-between gap-4 px-3 lg:px-2 flex-shrink-0 sticky top-0 z-30 lg:static">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 lg:hidden">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{ background: 'var(--ink)', color: 'var(--surface)' }}
            >
              U
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[var(--ink)]">UNICAR</span>
          </div>

          <div className="hidden lg:flex items-center flex-1 min-w-0">
            <button
              onClick={openPalette}
              className="glass flex items-center gap-2.5 h-10 pl-3.5 pr-2.5 rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors w-[280px]"
            >
              <Search className="w-[16px] h-[16px]" />
              <span className="text-[13px] flex-1 text-left">Поиск по CRM…</span>
              <kbd className="kbd">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile search */}
            <button onClick={openPalette} className="lg:hidden glass w-10 h-10 rounded-full flex items-center justify-center text-[var(--ink)]" aria-label="Поиск">
              <Search className="w-[18px] h-[18px]" />
            </button>
            {/* Notifications */}
            <NotificationsDropdown />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="glass w-10 h-10 rounded-full flex items-center justify-center text-[var(--ink)] transition-colors"
              aria-label="Сменить тему"
            >
              {theme === 'dark' ? <SunIcon className="w-[18px] h-[18px]" /> : <MoonIcon className="w-[18px] h-[18px]" />}
            </button>

            {/* Logout (mobile/desktop top) */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex lg:hidden glass w-10 h-10 rounded-full items-center justify-center text-[var(--ink)] transition-colors"
              aria-label="Выйти"
            >
              <LogoutIcon className="w-[18px] h-[18px]" />
            </button>

            {/* Date */}
            <div className="glass hidden xl:flex items-center px-4 h-10 rounded-full text-[12px] font-medium text-[var(--ink-2)]">
              {todayLabel}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 lg:overflow-y-auto scroll-refined" style={{ scrollbarGutter: 'stable' }}>
          <div key={location.pathname} className="px-3 lg:px-4 pb-4 lg:pb-3 pt-1 w-full page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Command palette (⌘K) */}
      <CommandPalette />

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 glass" style={{ borderRadius: 0, borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-around h-full px-2">
          {bottomNav.map((item) =>
            item.isMore ? (
              <button
                key={item.name}
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={clsx(
                  'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                  moreMenuOpen ? 'text-[var(--ink)]' : 'text-[var(--ink-subtle)]'
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </button>
            ) : (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                    isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-subtle)]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={clsx('w-6 h-6 transition-transform', isActive && 'scale-110')} />
                    <span className="text-[10px] font-medium">{item.name}</span>
                  </>
                )}
              </NavLink>
            )
          )}
        </div>
      </nav>

      {/* Mobile More Menu */}
      {moreMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMoreMenuOpen(false)} />
          <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 glass-strong rounded-t-3xl p-4 animate-slide-up">
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'Заявки', href: '/booking-requests', icon: InboxIcon },
                { name: 'ТО', href: '/maintenance', icon: WrenchIcon },
                { name: 'Финансы', href: '/finances', icon: ChartIcon },
                { name: 'Настройки', href: '/settings', icon: CogIcon },
                ...(isAdmin ? [{ name: 'Польз.', href: '/users', icon: UserGroupIcon }] : []),
              ].map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setMoreMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-colors',
                      isActive ? 'bg-[var(--surface-3)] text-[var(--ink)]' : 'text-[var(--ink-muted)] hover:bg-[var(--surface-2)]'
                    )
                  }
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.name}</span>
                </NavLink>
              ))}

              <button
                onClick={handleLogout}
                className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogoutIcon className="w-6 h-6" />
                <span className="text-xs font-medium">Выйти</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Icons (lucide)
function HomeIcon({ className }: { className?: string }) { return <Home className={className} /> }
function CarIcon({ className }: { className?: string }) { return <Car className={className} /> }
function KeyIcon({ className }: { className?: string }) { return <KeyRound className={className} /> }
function UsersIcon({ className }: { className?: string }) { return <Users className={className} /> }
function WrenchIcon({ className }: { className?: string }) { return <Wrench className={className} /> }
function ChartIcon({ className }: { className?: string }) { return <BarChart3 className={className} /> }
function CogIcon({ className }: { className?: string }) { return <Settings className={className} /> }
function SunIcon({ className }: { className?: string }) { return <Sun className={className} /> }
function MoonIcon({ className }: { className?: string }) { return <Moon className={className} /> }
function LogoutIcon({ className }: { className?: string }) { return <LogOut className={className} /> }
function ChevronIcon({ className }: { className?: string }) { return <ChevronLeft className={className} /> }
function InboxIcon({ className }: { className?: string }) { return <Inbox className={className} /> }
function BellIcon({ className }: { className?: string }) { return <Bell className={className} /> }
function CalendarNavIcon({ className }: { className?: string }) { return <CalendarDays className={className} /> }
function UserGroupIcon({ className }: { className?: string }) { return <UsersRound className={className} /> }
function MoreIcon({ className }: { className?: string }) { return <Menu className={className} /> }
