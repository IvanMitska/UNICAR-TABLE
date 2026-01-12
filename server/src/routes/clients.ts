import { Router, Request, Response } from 'express'
import { pool, toCamelCase } from '../db/database.js'

const router = Router()

interface ClientRow {
  id: number
  full_name: string
  phone: string
  phone_alt: string | null
  email: string | null
  passport: string
  license_number: string
  license_expiry: string
  birth_date: string
  address: string
  status: string
  notes: string | null
  created_at: string
}

// Get all clients
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<ClientRow>(`
      SELECT * FROM clients ORDER BY full_name
    `)

    res.json(result.rows.map(c => toCamelCase(c)))
  } catch (error) {
    console.error('Get clients error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single client
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query<ClientRow>(
      'SELECT * FROM clients WHERE id = $1',
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json(toCamelCase(result.rows[0]))
  } catch (error) {
    console.error('Get client error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create client
router.post('/', async (req: Request, res: Response) => {
  const {
    fullName,
    phone,
    phoneAlt,
    email,
    passport,
    licenseNumber,
    licenseExpiry,
    birthDate,
    address,
    status,
    notes,
  } = req.body

  if (!fullName || !phone || !passport || !licenseNumber || !licenseExpiry || !birthDate || !address) {
    return res.status(400).json({ error: 'Required fields missing' })
  }

  try {
    const result = await pool.query<ClientRow>(`
      INSERT INTO clients (
        full_name, phone, phone_alt, email, passport, license_number,
        license_expiry, birth_date, address, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      fullName,
      phone,
      phoneAlt || null,
      email || null,
      passport,
      licenseNumber,
      licenseExpiry,
      birthDate,
      address,
      status || 'active',
      notes || null
    ])

    res.status(201).json(toCamelCase(result.rows[0]))
  } catch (error) {
    console.error('Create client error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update client
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const {
    fullName,
    phone,
    phoneAlt,
    email,
    passport,
    licenseNumber,
    licenseExpiry,
    birthDate,
    address,
    status,
    notes,
  } = req.body

  try {
    const existing = await pool.query('SELECT * FROM clients WHERE id = $1', [id])

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' })
    }

    const result = await pool.query<ClientRow>(`
      UPDATE clients SET
        full_name = $1, phone = $2, phone_alt = $3, email = $4, passport = $5,
        license_number = $6, license_expiry = $7, birth_date = $8, address = $9,
        status = $10, notes = $11
      WHERE id = $12
      RETURNING *
    `, [
      fullName,
      phone,
      phoneAlt || null,
      email || null,
      passport,
      licenseNumber,
      licenseExpiry,
      birthDate,
      address,
      status,
      notes || null,
      id
    ])

    res.json(toCamelCase(result.rows[0]))
  } catch (error) {
    console.error('Update client error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete client
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    // Check if client has active rentals
    const activeRental = await pool.query(
      `SELECT id FROM rentals WHERE client_id = $1 AND status = 'active'`,
      [id]
    )

    if (activeRental.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete client with active rentals' })
    }

    await pool.query('DELETE FROM clients WHERE id = $1', [id])
    res.json({ success: true })
  } catch (error) {
    console.error('Delete client error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
