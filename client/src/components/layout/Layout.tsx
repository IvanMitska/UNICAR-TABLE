import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import NotificationsDropdown from './NotificationsDropdown'
import clsx from 'clsx'

// Bottom navigation items for mobile
const bottomNav = [
  { name: 'Главная', href: '/dashboard', icon: HomeIcon },
  { name: 'Аренды', href: '/rentals', icon: KeyIcon },
  { name: 'Авто', href: '/vehicles', icon: CarIcon },
  { name: 'Клиенты', href: '/clients', icon: UsersIcon },
  { name: 'Ещё', href: '#more', icon: MoreIcon, isMore: true },
]

// Sidebar navigation
const sidebarNav = [
  { name: 'Главная', href: '/dashboard', icon: HomeIcon },
  { name: 'Аренды', href: '/rentals', icon: KeyIcon, badge: true },
  { name: 'Заявки', href: '/booking-requests', icon: InboxIcon },
  { name: 'Автомобили', href: '/vehicles', icon: CarIcon },
  { name: 'Клиенты', href: '/clients', icon: UsersIcon },
  { name: 'Обслуживание', href: '/maintenance', icon: WrenchIcon },
  { name: 'Финансы', href: '/finances', icon: ChartIcon },
]

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Collapsed by default
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [activeRentalsCount, setActiveRentalsCount] = useState(0)
  const { logout, user, isAdmin } = useAuth()
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
    const interval = setInterval(fetchActiveRentals, 30000)
    return () => clearInterval(interval)
  }, [location.pathname])

  // Close more menu on route change
  useEffect(() => {
    setMoreMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Desktop sidebar item
  const SidebarItem = ({ item }: { item: typeof sidebarNav[0] }) => (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150',
          sidebarCollapsed ? 'justify-center' : '',
          isActive
            ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-medium shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={clsx('w-5 h-5 shrink-0', isActive && 'text-gray-900 dark:text-white')} />

          {!sidebarCollapsed && (
            <span className="flex-1 truncate">{item.name}</span>
          )}

          {!sidebarCollapsed && item.badge && activeRentalsCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full">
              {activeRentalsCount}
            </span>
          )}

          {/* Tooltip */}
          {sidebarCollapsed && (
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
              {item.name}
              {item.badge && activeRentalsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 dark:bg-gray-900/20 rounded">
                  {activeRentalsCount}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </NavLink>
  )

  const sidebarWidth = sidebarCollapsed ? 'w-[72px]' : 'w-64'
  const mainPadding = sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 pb-16 lg:pb-0">
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col transition-all duration-200',
          'bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800',
          sidebarWidth
        )}
      >
        {/* Logo */}
        <div className={clsx(
          'flex items-center h-14 border-b border-gray-200 dark:border-zinc-800',
          sidebarCollapsed ? 'justify-center px-2' : 'px-4'
        )}>
          <span className={clsx(
            'font-bold text-gray-900 dark:text-white',
            sidebarCollapsed ? 'text-lg' : 'text-xl tracking-tight'
          )}>
            {sidebarCollapsed ? 'U' : 'UNICAR'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {sidebarNav.map((item) => (
            <SidebarItem key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-gray-200 dark:border-zinc-800 space-y-1">
          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all',
                  sidebarCollapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-zinc-800/50'
                )
              }
            >
              <UserGroupIcon className="w-5 h-5" />
              {!sidebarCollapsed && <span>Пользователи</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap z-50">
                  Пользователи
                </div>
              )}
            </NavLink>
          )}

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all',
                sidebarCollapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-zinc-800/50'
              )
            }
          >
            <CogIcon className="w-5 h-5" />
            {!sidebarCollapsed && <span>Настройки</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap z-50">
                Настройки
              </div>
            )}
          </NavLink>

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={clsx(
              'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-all',
              sidebarCollapsed ? 'justify-center' : ''
            )}
          >
            <ChevronIcon className={clsx('w-5 h-5 transition-transform', sidebarCollapsed && 'rotate-180')} />
            {!sidebarCollapsed && <span>Свернуть</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={clsx('transition-all duration-200', mainPadding)}>
        {/* Top header */}
        <header className="sticky top-0 z-30 h-14 px-4 flex items-center justify-between gap-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800">
          {/* Left: User greeting */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 font-semibold text-sm">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.fullName || 'User'}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{isAdmin ? 'Администратор' : 'Агент'}</p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <NotificationsDropdown />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleLogout}
              className="hidden sm:flex p-2 rounded-xl text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogoutIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 safe-area-pb">
        <div className="flex items-center justify-around h-full px-2">
          {bottomNav.map((item) => (
            item.isMore ? (
              <button
                key={item.name}
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={clsx(
                  'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                  moreMenuOpen ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
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
                    isActive
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={clsx('w-6 h-6', isActive && 'scale-110')} />
                    <span className="text-[10px] font-medium">{item.name}</span>
                  </>
                )}
              </NavLink>
            )
          ))}
        </div>
      </nav>

      {/* Mobile More Menu */}
      {moreMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/50"
            onClick={() => setMoreMenuOpen(false)}
          />
          <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 rounded-t-2xl p-4 safe-area-pb animate-slide-up">
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
                      isActive
                        ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    )
                  }
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.name}</span>
                </NavLink>
              ))}

              {/* Logout in more menu for mobile */}
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

function UserGroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  )
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}
