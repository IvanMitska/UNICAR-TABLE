import { Router, Request, Response } from 'express'
import { pool, toCamelCase } from '../db/database.js'

const router = Router()

interface VehicleRow {
  id: number
  brand: string
  model: string
  license_plate: string
  vin: string | null
  year: number
  color: string
  fuel_type: string
  mileage: number
  status: string
  rate_daily: number
  rate_3days: number
  rate_7days: number
  rate_monthly: number
  insurance_expiry: string | null
  inspection_expiry: string | null
  photo_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Get all vehicles
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<VehicleRow>(`
      SELECT * FROM vehicles
      WHERE status != 'archived'
      ORDER BY brand, model
    `)

    res.json(result.rows.map(v => toCamelCase(v)))
  } catch (error) {
    console.error('Get vehicles error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single vehicle
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query<VehicleRow>(
      'SELECT * FROM vehicles WHERE id = $1',
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    res.json(toCamelCase(result.rows[0]))
  } catch (error) {
    console.error('Get vehicle error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create vehicle
router.post('/', async (req: Request, res: Response) => {
  const {
    brand,
    model,
    licensePlate,
    vin,
    year,
    color,
    fuelType,
    mileage,
    status,
    rateDaily,
    rate3days,
    rate7days,
    rateMonthly,
    insuranceExpiry,
    inspectionExpiry,
    photoUrl,
    notes,
  } = req.body

  if (!brand || !model || !licensePlate || !year || !color) {
    return res.status(400).json({ error: 'Required fields missing' })
  }

  try {
    const result = await pool.query<VehicleRow>(`
      INSERT INTO vehicles (
        brand, model, license_plate, vin, year, color, fuel_type, mileage,
        status, rate_daily, rate_3days, rate_7days, rate_monthly,
        insurance_expiry, inspection_expiry, photo_url, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      brand,
      model,
      licensePlate,
      vin || null,
      year,
      color,
      fuelType || 'petrol',
      mileage || 0,
      status || 'available',
      rateDaily || 0,
      rate3days || 0,
      rate7days || 0,
      rateMonthly || 0,
      insuranceExpiry || null,
      inspectionExpiry || null,
      photoUrl || null,
      notes || null
    ])

    res.status(201).json(toCamelCase(result.rows[0]))
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({ error: 'License plate already exists' })
    }
    console.error('Create vehicle error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update vehicle
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const {
    brand,
    model,
    licensePlate,
    vin,
    year,
    color,
    fuelType,
    mileage,
    status,
    rateDaily,
    rate3days,
    rate7days,
    rateMonthly,
    insuranceExpiry,
    inspectionExpiry,
    photoUrl,
    notes,
  } = req.body

  try {
    const existing = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id])

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    const result = await pool.query<VehicleRow>(`
      UPDATE vehicles SET
        brand = $1, model = $2, license_plate = $3, vin = $4, year = $5,
        color = $6, fuel_type = $7, mileage = $8, status = $9,
        rate_daily = $10, rate_3days = $11, rate_7days = $12, rate_monthly = $13,
        insurance_expiry = $14, inspection_expiry = $15, photo_url = $16, notes = $17,
        updated_at = NOW()
      WHERE id = $18
      RETURNING *
    `, [
      brand,
      model,
      licensePlate,
      vin || null,
      year,
      color,
      fuelType,
      mileage,
      status,
      rateDaily || 0,
      rate3days || 0,
      rate7days || 0,
      rateMonthly || 0,
      insuranceExpiry || null,
      inspectionExpiry || null,
      photoUrl || null,
      notes || null,
      id
    ])

    res.json(toCamelCase(result.rows[0]))
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({ error: 'License plate already exists' })
    }
    console.error('Update vehicle error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete vehicle
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    // Check if vehicle has active rentals
    const activeRental = await pool.query(
      `SELECT id FROM rentals WHERE vehicle_id = $1 AND status = 'active'`,
      [id]
    )

    if (activeRental.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete vehicle with active rentals' })
    }

    // Archive instead of hard delete
    await pool.query(
      `UPDATE vehicles SET status = 'archived', updated_at = NOW() WHERE id = $1`,
      [id]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Delete vehicle error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
