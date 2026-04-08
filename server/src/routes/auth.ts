import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pool } from '../db/database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

interface User {
  id: number
  username: string
  password_hash: string
  full_name: string
  role: 'admin' | 'agent'
  is_active: boolean
}

// Login with username and password
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  try {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username.toLowerCase().trim()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]
    const isValid = bcrypt.compareSync(password, user.password_hash)

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Create session with user_id
    const sessionId = uuidv4()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await pool.query(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
      [sessionId, user.id, expiresAt.toISOString()]
    )

    // Update last_login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    )

    // Clean old sessions
    await pool.query('DELETE FROM sessions WHERE expires_at < NOW()')

    res.cookie('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })

    // Return user info (without password_hash)
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/logout', async (req: Request, res: Response) => {
  const sessionId = req.cookies.session

  try {
    if (sessionId) {
      await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId])
    }

    res.clearCookie('session')
    res.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Check session and return user info
router.get('/check', async (req: Request, res: Response) => {
  const sessionId = req.cookies.session

  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const result = await pool.query<{
      user_id: number
      username: string
      full_name: string
      role: string
    }>(`
      SELECT s.user_id, u.username, u.full_name, u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1 AND s.expires_at > NOW() AND u.is_active = true
    `, [sessionId])

    if (result.rows.length === 0) {
      res.clearCookie('session')
      return res.status(401).json({ error: 'Session expired' })
    }

    const userData = result.rows[0]
    res.json({
      authenticated: true,
      user: {
        id: userData.user_id,
        username: userData.username,
        fullName: userData.full_name,
        role: userData.role
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Change own password (requires authentication)
router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  try {
    const result = await pool.query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isValid = bcrypt.compareSync(currentPassword, result.rows[0].password_hash)

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10)
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId])

    res.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
