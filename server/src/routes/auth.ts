import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pool } from '../db/database.js'

const router = Router()

interface Setting {
  key: string
  value: string
}

router.post('/login', async (req: Request, res: Response) => {
  const { pin } = req.body

  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ error: 'PIN is required' })
  }

  try {
    const result = await pool.query<Setting>('SELECT value FROM settings WHERE key = $1', ['pin'])

    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'PIN not configured' })
    }

    const isValid = bcrypt.compareSync(pin, result.rows[0].value)

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    // Create session
    const sessionId = uuidv4()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await pool.query(
      'INSERT INTO sessions (id, expires_at) VALUES ($1, $2)',
      [sessionId, expiresAt.toISOString()]
    )

    // Clean old sessions
    await pool.query('DELETE FROM sessions WHERE expires_at < NOW()')

    res.cookie('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })

    res.json({ success: true })
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

router.get('/check', async (req: Request, res: Response) => {
  const sessionId = req.cookies.session

  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const result = await pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW()',
      [sessionId]
    )

    if (result.rows.length === 0) {
      res.clearCookie('session')
      return res.status(401).json({ error: 'Session expired' })
    }

    res.json({ authenticated: true })
  } catch (error) {
    console.error('Auth check error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/change-pin', async (req: Request, res: Response) => {
  const sessionId = req.cookies.session
  const { currentPin, newPin } = req.body

  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  if (!currentPin || !newPin) {
    return res.status(400).json({ error: 'Current and new PIN are required' })
  }

  if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
    return res.status(400).json({ error: 'PIN must be 4-6 digits' })
  }

  try {
    const result = await pool.query<Setting>('SELECT value FROM settings WHERE key = $1', ['pin'])

    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'PIN not configured' })
    }

    const isValid = bcrypt.compareSync(currentPin, result.rows[0].value)

    if (!isValid) {
      return res.status(401).json({ error: 'Current PIN is incorrect' })
    }

    const hashedPin = bcrypt.hashSync(newPin, 10)
    await pool.query('UPDATE settings SET value = $1 WHERE key = $2', [hashedPin, 'pin'])

    res.json({ success: true })
  } catch (error) {
    console.error('Change PIN error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
