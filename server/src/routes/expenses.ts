import { Router, Request, Response } from 'express'
import { pool, toCamelCase } from '../db/database.js'

const router = Router()

// Get all expenses
router.get('/', async (req: Request, res: Response) => {
  const { from, to } = req.query

  try {
    let query = `
      SELECT e.*, v.brand as vehicle_brand, v.model as vehicle_model, v.license_plate as vehicle_license_plate
      FROM expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
    `

    const params: string[] = []

    if (from && to) {
      query += ' WHERE e.date BETWEEN $1 AND $2'
      params.push(from as string, to as string)
    }

    query += ' ORDER BY e.date DESC'

    const result = await pool.query(query, params)

    const records = result.rows.map((r) => ({
      ...toCamelCase<Record<string, unknown>>(r),
      vehicle: r.vehicle_id ? {
        id: r.vehicle_id,
        brand: r.vehicle_brand,
        model: r.vehicle_model,
        licensePlate: r.vehicle_license_plate,
      } : null,
    }))

    res.json(records)
  } catch (error) {
    console.error('Get expenses error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create expense
router.post('/', async (req: Request, res: Response) => {
  const { vehicleId, category, amount, date, description } = req.body

  if (!category || amount === undefined || !date || !description) {
    return res.status(400).json({ error: 'Required fields missing' })
  }

  try {
    const result = await pool.query(`
      INSERT INTO expenses (vehicle_id, category, amount, date, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      vehicleId || null,
      category,
      amount,
      date,
      description
    ])

    res.status(201).json(toCamelCase(result.rows[0] as Record<string, unknown>))
  } catch (error) {
    console.error('Create expense error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete expense
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    console.error('Delete expense error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
