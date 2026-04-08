import { Request, Response, NextFunction } from 'express'
import { pool } from '../db/database.js'

export type UserRole = 'admin' | 'agent'

export interface AuthUser {
  id: number
  username: string
  fullName: string
  role: UserRole
}

interface SessionWithUser {
  id: string
  user_id: number
  username: string
  full_name: string
  role: UserRole
  expires_at: string
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

// Main auth middleware - verifies session and loads user
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // DEV MODE: Skip auth check but set a mock admin user
  if (process.env.NODE_ENV !== 'production') {
    req.user = {
      id: 1,
      username: 'admin',
      fullName: 'Dev Admin',
      role: 'admin'
    }
    return next()
  }

  const sessionId = req.cookies.session

  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const result = await pool.query<SessionWithUser>(`
      SELECT s.id, s.user_id, s.expires_at, u.username, u.full_name, u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1 AND s.expires_at > NOW() AND u.is_active = true
    `, [sessionId])

    if (result.rows.length === 0) {
      res.clearCookie('session')
      return res.status(401).json({ error: 'Session expired' })
    }

    const session = result.rows[0]
    req.user = {
      id: session.user_id,
      username: session.username,
      fullName: session.full_name,
      role: session.role as UserRole
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Middleware factory to require specific role(s)
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    next()
  }
}

// Shorthand middleware for admin-only routes
export const adminOnly = requireRole('admin')

// Helper to check if user can edit a resource they created
export function canEditOwn(createdById: number | null, user: AuthUser): boolean {
  // Admins can edit anything
  if (user.role === 'admin') return true
  // Agents can only edit their own records
  return createdById === user.id
}
