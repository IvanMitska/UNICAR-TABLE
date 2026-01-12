import { Request, Response, NextFunction } from 'express'
import { pool } from '../db/database.js'

interface Session {
  id: string
  created_at: string
  expires_at: string
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies.session

  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const result = await pool.query<Session>(
      'SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW()',
      [sessionId]
    )

    if (result.rows.length === 0) {
      res.clearCookie('session')
      return res.status(401).json({ error: 'Session expired' })
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
