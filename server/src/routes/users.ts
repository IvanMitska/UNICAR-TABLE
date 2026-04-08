import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db/database.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

// All routes require authentication and admin role
router.use(authMiddleware)
router.use(adminOnly)

interface UserRow {
  id: number
  username: string
  full_name: string
  role: 'admin' | 'agent'
  is_active: boolean
  created_at: string
  last_login: string | null
}

// Get all users
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<UserRow>(`
      SELECT id, username, full_name, role, is_active, created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `)

    const users = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      lastLogin: row.last_login
    }))

    res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single user
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const result = await pool.query<UserRow>(
      'SELECT id, username, full_name, role, is_active, created_at, last_login FROM users WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const row = result.rows[0]
    res.json({
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      lastLogin: row.last_login
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new user
router.post('/', async (req: Request, res: Response) => {
  const { username, password, fullName, role } = req.body

  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Username, password, and full name are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const validRoles = ['admin', 'agent']
  const userRole = validRoles.includes(role) ? role : 'agent'

  try {
    // Check if username exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username.toLowerCase().trim()]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)

    const result = await pool.query<{ id: number }>(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [username.toLowerCase().trim(), hashedPassword, fullName.trim(), userRole]
    )

    res.status(201).json({
      id: result.rows[0].id,
      username: username.toLowerCase().trim(),
      fullName: fullName.trim(),
      role: userRole,
      isActive: true
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const { fullName, role, isActive, password } = req.body
  const currentUserId = req.user?.id

  try {
    // Check if user exists
    const existingUser = await pool.query<{ id: number; username: string }>(
      'SELECT id, username FROM users WHERE id = $1',
      [id]
    )

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Prevent admin from deactivating themselves
    if (Number(id) === currentUserId && isActive === false) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' })
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: (string | boolean)[] = []
    let paramCount = 1

    if (fullName !== undefined) {
      updates.push(`full_name = $${paramCount++}`)
      values.push(fullName.trim())
    }

    if (role !== undefined && ['admin', 'agent'].includes(role)) {
      // Prevent admin from demoting themselves
      if (Number(id) === currentUserId && role !== 'admin') {
        return res.status(400).json({ error: 'Cannot change your own role' })
      }
      updates.push(`role = $${paramCount++}`)
      values.push(role)
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`)
      values.push(isActive)
    }

    if (password !== undefined && password.length >= 6) {
      const hashedPassword = bcrypt.hashSync(password, 10)
      updates.push(`password_hash = $${paramCount++}`)
      values.push(hashedPassword)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    values.push(id)
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    )

    // Return updated user
    const result = await pool.query<UserRow>(
      'SELECT id, username, full_name, role, is_active, created_at, last_login FROM users WHERE id = $1',
      [id]
    )

    const row = result.rows[0]
    res.json({
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      lastLogin: row.last_login
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete user (soft delete - set is_active = false)
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const currentUserId = req.user?.id

  // Prevent admin from deleting themselves
  if (Number(id) === currentUserId) {
    return res.status(400).json({ error: 'Cannot delete your own account' })
  }

  try {
    const result = await pool.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Reset user password (admin sets a new password)
router.post('/:id/reset-password', async (req: Request, res: Response) => {
  const { id } = req.params
  const { newPassword } = req.body

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  try {
    const hashedPassword = bcrypt.hashSync(newPassword, 10)

    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
      [hashedPassword, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
