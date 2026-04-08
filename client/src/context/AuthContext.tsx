import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export type UserRole = 'admin' | 'agent'

export interface User {
  id: number
  username: string
  fullName: string
  role: UserRole
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  failedAttempts: number
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  // Role helpers
  isAdmin: boolean
  isAgent: boolean
  canEdit: (resourceType: 'vehicle' | 'rental' | 'client' | 'expense') => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const isDev = import.meta.env.DEV

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(isDev)
  const [isLoading, setIsLoading] = useState(!isDev)
  const [user, setUser] = useState<User | null>(isDev ? {
    id: 1,
    username: 'admin',
    fullName: 'Dev Admin',
    role: 'admin'
  } : null)
  const [failedAttempts, setFailedAttempts] = useState(0)

  const checkAuth = useCallback(async () => {
    // DEV MODE: Skip auth check
    if (isDev) {
      setIsAuthenticated(true)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(true)
        setUser(data.user)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch {
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(true)
        setUser(data.user)
        setFailedAttempts(0)
        return true
      } else {
        setFailedAttempts(prev => prev + 1)
        return false
      }
    } catch {
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setIsAuthenticated(false)
      setUser(null)
    }
  }

  // Role helpers
  const isAdmin = user?.role === 'admin'
  const isAgent = user?.role === 'agent'

  const canEdit = (resourceType: 'vehicle' | 'rental' | 'client' | 'expense'): boolean => {
    if (!user) return false
    if (isAdmin) return true

    // Agents can:
    // - Create rentals
    // - Create/edit clients
    // - Create expenses
    // - View vehicles (but not edit)
    switch (resourceType) {
      case 'vehicle':
        return false // Only admins can edit vehicles
      case 'rental':
        return true // Agents can create rentals
      case 'client':
        return true // Agents can manage clients
      case 'expense':
        return true // Agents can add expenses
      default:
        return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        failedAttempts,
        login,
        logout,
        checkAuth,
        isAdmin,
        isAgent,
        canEdit,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
