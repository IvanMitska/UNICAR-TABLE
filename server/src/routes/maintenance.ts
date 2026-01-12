import { Router, Request, Response } from 'express'
import { pool, toCamelCase } from '../db/database.js'

const router = Router()

// Get all maintenance records
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT m.*, v.brand as vehicle_brand, v.model as vehicle_model, v.license_plate as vehicle_license_plate
      FROM maintenance m
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      ORDER BY m.date DESC
    `)

    const records = result.rows.map((r) => ({
      ...toCamelCase<Record<string, unknown>>(r),
      vehicle: {
        id: r.vehicle_id,
        brand: r.vehicle_brand,
        model: r.vehicle_model,
        licensePlate: r.vehicle_license_plate,
      },
    }))

    res.json(records)
  } catch (error) {
    console.error('Get maintenance error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get maintenance for specific vehicle
router.get('/vehicle/:vehicleId', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM maintenance WHERE vehicle_id = $1 ORDER BY date DESC`,
      [req.params.vehicleId]
    )

    res.json(result.rows.map(r => toCamelCase(r as Record<string, unknown>)))
  } catch (error) {
    console.error('Get vehicle maintenance error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create maintenance record
router.post('/', async (req: Request, res: Response) => {
  const {
    vehicleId,
    type,
    date,
    mileage,
    cost,
    location,
    description,
    nextMaintenanceMileage,
    nextMaintenanceDate,
  } = req.body

  if (!vehicleId || !type || !date || mileage === undefined || cost === undefined || !location || !description) {
    return res.status(400).json({ error: 'Required fields missing' })
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const result = await client.query(`
      INSERT INTO maintenance (
        vehicle_id, type, date, mileage, cost, location, description,
        next_maintenance_mileage, next_maintenance_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      vehicleId,
      type,
      date,
      mileage,
      cost,
      location,
      description,
      nextMaintenanceMileage || null,
      nextMaintenanceDate || null
    ])

    // Update vehicle mileage if higher
    await client.query(`
      UPDATE vehicles SET mileage = GREATEST(mileage, $1), updated_at = NOW() WHERE id = $2
    `, [mileage, vehicleId])

    await client.query('COMMIT')

    res.status(201).json(toCamelCase(result.rows[0] as Record<string, unknown>))
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Create maintenance error:', error)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    client.release()
  }
})

export default router
