import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import SearchBar from './SearchBar'
import NotificationsDropdown from './NotificationsDropdown'
import clsx from 'clsx'

const mainNav = [
  { name: 'Главная', href: '/dashboard', icon: HomeIcon, description: 'Обзор и статистика' },
  { name: 'Аренды', href: '/rentals', icon: KeyIcon, description: 'Управление арендами', badge: true },
  { name: 'Заявки', href: '/booking-requests', icon: InboxIcon, description: 'Заявки с сайта' },
]

const directoryNav = [
  { name: 'Автомобили', href: '/vehicles', icon: CarIcon, description: 'Автопарк' },
  { name: 'Клиенты', href: '/clients', icon: UsersIcon, description: 'База клиентов' },
]

const managementNav = [
  { name: 'Обслуживание', href: '/maintenance', icon: WrenchIcon, description: 'ТО и ремонт' },
  { name: 'Финансы', href: '/finances', icon: ChartIcon, description: 'Отчёты и аналитика' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeRentalsCount, setActiveRentalsCount] = useState(0)
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

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
    // Refetch every 30 seconds
    const interval = setInterval(fetchActiveRentals, 30000)
    return () => clearInterval(interval)
  }, [location.pathname])

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const NavItem = ({ item, collapsed }: { item: typeof mainNav[0]; collapsed: boolean }) => (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          collapsed ? 'justify-center' : '',
          isActive
            ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-100 dark:border-zinc-700 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-900 dark:bg-white rounded-r-full" />
          )}

          {/* Icon container */}
          <span className={clsx(
            'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200',
            isActive
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-zinc-700 group-hover:text-gray-700 dark:group-hover:text-gray-200'
          )}>
            <item.icon className="w-5 h-5" />
          </span>

          {/* Text */}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate">{item.name}</span>
                {item.badge && activeRentalsCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full">
                    {activeRentalsCount}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{item.description}</p>
            </div>
          )}

          {/* Tooltip for collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-zinc-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-gray-800 dark:border-zinc-700">
              {item.name}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-zinc-800 rotate-45" />
            </div>
          )}
        </>
      )}
    </NavLink>
  )

  const NavSection = ({ title, items, collapsed }: { title: string; items: typeof mainNav; collapsed: boolean }) => (
    <div className="mb-6">
      {!collapsed && (
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {title}
        </p>
      )}
      {collapsed && <div className="h-px bg-gray-200 dark:bg-zinc-800 mx-3 mb-3" />}
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.name} item={item} collapsed={collapsed} />
        ))}
      </div>
    </div>
  )

  const sidebarWidth = sidebarCollapsed ? 'w-20' : 'w-72'
  const mainPadding = sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Mobile sidebar overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-out',
          'bg-white dark:bg-zinc-900',
          'border-r border-gray-100 dark:border-zinc-800',
          sidebarWidth,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo & collapse button */}
        <div className={clsx(
          'flex items-center justify-between h-16 border-b border-gray-100 dark:border-zinc-800',
          sidebarCollapsed ? 'px-2' : 'px-4'
        )}>
          <span className={clsx(
            'font-bold tracking-wider text-gray-900 dark:text-white',
            sidebarCollapsed ? 'text-sm' : 'text-lg'
          )}>
            UNICAR
          </span>

          {/* Collapse button - desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={clsx(
              'hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors',
              sidebarCollapsed && 'absolute -right-3 top-5 w-6 h-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-md'
            )}
          >
            <ChevronIcon className={clsx('w-4 h-4 transition-transform', sidebarCollapsed ? 'rotate-180' : '')} />
          </button>

          {/* Close button - mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Quick action */}
        <div className={clsx('p-3 border-b border-gray-100 dark:border-zinc-800', sidebarCollapsed && 'px-2')}>
          <button
            onClick={() => navigate('/rentals?action=new')}
            className={clsx(
              'w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98]',
              sidebarCollapsed ? 'p-3' : 'px-4 py-3.5'
            )}
          >
            <PlusIcon className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm">Новая аренда</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin">
          <NavSection title="Основное" items={mainNav} collapsed={sidebarCollapsed} />
          <NavSection title="Справочники" items={directoryNav} collapsed={sidebarCollapsed} />
          <NavSection title="Учёт" items={managementNav} collapsed={sidebarCollapsed} />
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-gray-100 dark:border-zinc-800 space-y-1">
          {/* Settings */}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                sidebarCollapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
              )
            }
          >
            <CogIcon className="w-5 h-5" />
            {!sidebarCollapsed && <span>Настройки</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-zinc-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg border border-gray-800 dark:border-zinc-700">
                Настройки
              </div>
            )}
          </NavLink>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={clsx(
              'group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200',
              sidebarCollapsed ? 'justify-center' : ''
            )}
          >
            <div className="relative w-5 h-5">
              <SunIcon className={clsx(
                'w-5 h-5 absolute inset-0 transition-all duration-300',
                theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
              )} />
              <MoonIcon className={clsx(
                'w-5 h-5 absolute inset-0 transition-all duration-300',
                theme === 'dark' ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'
              )} />
            </div>
            {!sidebarCollapsed && <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-zinc-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg border border-gray-800 dark:border-zinc-700">
                {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={clsx(
              'group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200',
              sidebarCollapsed ? 'justify-center' : ''
            )}
          >
            <LogoutIcon className="w-5 h-5" />
            {!sidebarCollapsed && <span>Выйти</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-zinc-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg border border-gray-800 dark:border-zinc-700">
                Выйти
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={clsx('transition-all duration-300', mainPadding)}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 px-4 lg:px-6 flex items-center gap-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-zinc-800">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          {/* Search bar */}
          <SearchBar />

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationsDropdown />

            {/* User menu */}
            <div className="hidden sm:flex items-center gap-3 pl-3 ml-1 border-l border-gray-200 dark:border-zinc-700">
              <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 font-semibold text-sm">
                U
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Admin</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Управляющий</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Icons
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
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

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  )
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  )
}
