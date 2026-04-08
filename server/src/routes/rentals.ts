import { Router, Request, Response } from 'express'
import { pool, toCamelCase } from '../db/database.js'
import { getRentalPriceInfo } from '../utils/pricing.js'

const router = Router()

// Get all rentals with vehicle and client info
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT r.*,
        v.brand as vehicle_brand, v.model as vehicle_model, v.license_plate as vehicle_license_plate,
        c.full_name as client_full_name, c.phone as client_phone,
        u.full_name as created_by_name
      FROM rentals r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.created_at DESC
    `)

    const rentals = result.rows.map((r) => ({
      ...toCamelCase<Record<string, unknown>>(r),
      vehicle: {
        id: r.vehicle_id,
        brand: r.vehicle_brand,
        model: r.vehicle_model,
        licensePlate: r.vehicle_license_plate,
      },
      client: {
        id: r.client_id,
        fullName: r.client_full_name,
        phone: r.client_phone,
      },
      createdByName: r.created_by_name || null,
    }))

    res.json(rentals)
  } catch (error) {
    console.error('Get rentals error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get active rentals
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT r.*,
        v.brand as vehicle_brand, v.model as vehicle_model, v.license_plate as vehicle_license_plate,
        c.full_name as client_full_name, c.phone as client_phone,
        u.full_name as created_by_name
      FROM rentals r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.status = 'active'
      ORDER BY r.planned_end_date ASC
    `)

    const rentals = result.rows.map((r) => ({
      ...toCamelCase<Record<string, unknown>>(r),
      vehicle: {
        id: r.vehicle_id,
        brand: r.vehicle_brand,
        model: r.vehicle_model,
        licensePlate: r.vehicle_license_plate,
      },
      client: {
        id: r.client_id,
        fullName: r.client_full_name,
        phone: r.client_phone,
      },
      createdByName: r.created_by_name || null,
    }))

    res.json(rentals)
  } catch (error) {
    console.error('Get active rentals error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single rental
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT r.*,
        v.brand as vehicle_brand, v.model as vehicle_model, v.license_plate as vehicle_license_plate,
        c.full_name as client_full_name, c.phone as client_phone,
        u.full_name as created_by_name
      FROM rentals r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = $1
    `, [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rental not found' })
    }

    const r = result.rows[0]
    const rental = {
      ...toCamelCase<Record<string, unknown>>(r),
      vehicle: {
        id: r.vehicle_id,
        brand: r.vehicle_brand,
        model: r.vehicle_model,
        licensePlate: r.vehicle_license_plate,
      },
      client: {
        id: r.client_id,
        fullName: r.client_full_name,
        phone: r.client_phone,
      },
      createdByName: r.created_by_name || null,
    }

    res.json(rental)
  } catch (error) {
    console.error('Get rental error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create rental
router.post('/', async (req: Request, res: Response) => {
  const {
    vehicleId,
    clientId,
    startDate,
    plannedEndDate,
    mileageStart,
    fuelLevelStart,
    rateType,
    rateAmount,
    deposit,
    paymentMethod,
    extras,
    conditionStart,
    notes,
  } = req.body

  if (!vehicleId || !clientId || !startDate || !plannedEndDate || mileageStart === undefined || !rateAmount) {
    return res.status(400).json({ error: 'Required fields missing' })
  }

  const client = await pool.connect()

  try {
    // Check if vehicle is available
    const vehicleResult = await client.query(
      'SELECT status FROM vehicles WHERE id = $1',
      [vehicleId]
    )

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    if (vehicleResult.rows[0].status !== 'available') {
      return res.status(400).json({ error: 'Vehicle is not available' })
    }

    // Calculate pricing using smooth discount grid
    // rateAmount is the BASE daily price (full price for 1 day)
    const start = new Date(startDate)
    const end = new Date(plannedEndDate)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

    // Get daily rate with discount and total price
    const priceInfo = getRentalPriceInfo(rateAmount, days)
    const totalAmount = priceInfo.totalPrice

    await client.query('BEGIN')

    // Create rental with created_by tracking
    const userId = req.user?.id || null
    const rentalResult = await client.query(`
      INSERT INTO rentals (
        vehicle_id, client_id, start_date, planned_end_date, mileage_start, fuel_level_start,
        rate_type, rate_amount, deposit, payment_method, total_amount,
        extras, condition_start, notes, status, payment_status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active', 'unpaid', $15)
      RETURNING *
    `, [
      vehicleId,
      clientId,
      startDate,
      plannedEndDate,
      mileageStart,
      fuelLevelStart ?? 100,
      rateType || 'daily',
      rateAmount,
      deposit || 0,
      paymentMethod || 'cash',
      totalAmount,
      extras || null,
      conditionStart || null,
      notes || null,
      userId
    ])

    // Update vehicle status
    await client.query(
      `UPDATE vehicles SET status = 'rented', updated_at = NOW() WHERE id = $1`,
      [vehicleId]
    )

    await client.query('COMMIT')

    res.status(201).json(toCamelCase(rentalResult.rows[0] as Record<string, unknown>))
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Create rental error:', error)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    client.release()
  }
})

// Update rental
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const {
    plannedEndDate,
    rateType,
    rateAmount,
    deposit,
    paymentMethod,
    paymentStatus,
    extras,
    conditionStart,
    notes,
  } = req.body

  try {
    const existingResult = await pool.query(
      'SELECT * FROM rentals WHERE id = $1',
      [id]
    )

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rental not found' })
    }

    const existing = existingResult.rows[0] as Record<string, unknown>

    // Recalculate total amount using smooth discount grid
    const start = new Date(existing.start_date as string)
    const end = new Date(plannedEndDate)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

    const basePrice = rateAmount || (existing.rate_amount as number)
    const priceInfo = getRentalPriceInfo(basePrice, days)
    const totalAmount = priceInfo.totalPrice

    const result = await pool.query(`
      UPDATE rentals SET
        planned_end_date = $1, rate_type = $2, rate_amount = $3, deposit = $4,
        payment_method = $5, payment_status = $6, total_amount = $7,
        extras = $8, condition_start = $9, notes = $10
      WHERE id = $11
      RETURNING *
    `, [
      plannedEndDate,
      rateType || existing.rate_type,
      rateAmount || existing.rate_amount,
      deposit ?? existing.deposit,
      paymentMethod || existing.payment_method,
      paymentStatus || existing.payment_status,
      totalAmount,
      extras ?? existing.extras,
      conditionStart ?? existing.condition_start,
      notes ?? existing.notes,
      id
    ])

    res.json(toCamelCase(result.rows[0] as Record<string, unknown>))
  } catch (error) {
    console.error('Update rental error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Complete rental
router.post('/:id/complete', async (req: Request, res: Response) => {
  const { id } = req.params
  const { mileageEnd, fuelLevelEnd, actualEndDate, conditionEnd, depositReturned } = req.body

  const client = await pool.connect()

  try {
    const rentalResult = await client.query(
      'SELECT * FROM rentals WHERE id = $1',
      [id]
    )

    if (rentalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rental not found' })
    }

    const rental = rentalResult.rows[0] as Record<string, unknown>

    if (rental.status !== 'active' && rental.status !== 'overdue') {
      return res.status(400).json({ error: 'Rental is not active or overdue' })
    }

    await client.query('BEGIN')

    // Update rental
    await client.query(`
      UPDATE rentals SET
        actual_end_date = $1, mileage_end = $2, fuel_level_end = $3, condition_end = $4,
        deposit_returned = $5, status = 'completed', payment_status = 'paid'
      WHERE id = $6
    `, [
      actualEndDate || new Date().toISOString(),
      mileageEnd,
      fuelLevelEnd ?? null,
      conditionEnd || null,
      depositReturned ? 1 : 0,
      id
    ])

    // Update vehicle status and mileage
    await client.query(`
      UPDATE vehicles SET
        status = 'available', mileage = $1, updated_at = NOW()
      WHERE id = $2
    `, [mileageEnd, rental.vehicle_id])

    await client.query('COMMIT')

    const updatedResult = await pool.query('SELECT * FROM rentals WHERE id = $1', [id])
    res.json(toCamelCase(updatedResult.rows[0] as Record<string, unknown>))
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Complete rental error:', error)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    client.release()
  }
})

// Calculate price preview (for UI)
router.post('/calculate-price', async (req: Request, res: Response) => {
  const { basePrice, days } = req.body

  if (!basePrice || !days) {
    return res.status(400).json({ error: 'basePrice and days are required' })
  }

  const priceInfo = getRentalPriceInfo(basePrice, days)
  res.json(priceInfo)
})

export default router
