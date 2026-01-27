import { Router, Request, Response } from 'express'
import { pool, toCamelCase } from '../db/database.js'

const router = Router()

/**
 * GET /api/booking-requests
 * Get all booking requests with optional status filter
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query

    let query = `
      SELECT
        br.*,
        v.brand as vehicle_brand,
        v.model as vehicle_model,
        v.license_plate as vehicle_license_plate,
        v.year as vehicle_year,
        v.color as vehicle_color
      FROM booking_requests br
      LEFT JOIN vehicles v ON br.vehicle_id = v.id
    `

    const params: string[] = []
    if (status) {
      query += ' WHERE br.status = $1'
      params.push(status as string)
    }

    query += ' ORDER BY br.created_at DESC'

    const result = await pool.query(query, params)

    const bookingRequests = result.rows.map(row => {
      const request = toCamelCase<Record<string, unknown>>(row)
      // Parse additional_services JSON
      if (typeof request.additionalServices === 'string') {
        request.additionalServices = JSON.parse(request.additionalServices as string)
      }
      // Add vehicle info
      request.vehicle = {
        id: row.vehicle_id,
        brand: row.vehicle_brand,
        model: row.vehicle_model,
        licensePlate: row.vehicle_license_plate,
        year: row.vehicle_year,
        color: row.vehicle_color,
      }
      return request
    })

    res.json(bookingRequests)
  } catch (error) {
    console.error('Error fetching booking requests:', error)
    res.status(500).json({ error: 'Failed to fetch booking requests' })
  }
})

/**
 * GET /api/booking-requests/:id
 * Get single booking request
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await pool.query(`
      SELECT
        br.*,
        v.brand as vehicle_brand,
        v.model as vehicle_model,
        v.license_plate as vehicle_license_plate,
        v.year as vehicle_year,
        v.color as vehicle_color,
        v.photo_url as vehicle_photo_url
      FROM booking_requests br
      LEFT JOIN vehicles v ON br.vehicle_id = v.id
      WHERE br.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking request not found' })
    }

    const row = result.rows[0]
    const request = toCamelCase<Record<string, unknown>>(row)
    if (typeof request.additionalServices === 'string') {
      request.additionalServices = JSON.parse(request.additionalServices as string)
    }
    request.vehicle = {
      id: row.vehicle_id,
      brand: row.vehicle_brand,
      model: row.vehicle_model,
      licensePlate: row.vehicle_license_plate,
      year: row.vehicle_year,
      color: row.vehicle_color,
      photoUrl: row.vehicle_photo_url,
    }

    res.json(request)
  } catch (error) {
    console.error('Error fetching booking request:', error)
    res.status(500).json({ error: 'Failed to fetch booking request' })
  }
})

/**
 * PUT /api/booking-requests/:id/status
 * Update booking request status
 */
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, adminNotes } = req.body

    if (!status || !['pending', 'confirmed', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const result = await pool.query(`
      UPDATE booking_requests
      SET status = $1, admin_notes = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, adminNotes || null, id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking request not found' })
    }

    const request = toCamelCase<Record<string, unknown>>(result.rows[0])
    if (typeof request.additionalServices === 'string') {
      request.additionalServices = JSON.parse(request.additionalServices as string)
    }

    res.json(request)
  } catch (error) {
    console.error('Error updating booking request status:', error)
    res.status(500).json({ error: 'Failed to update booking request status' })
  }
})

/**
 * POST /api/booking-requests/:id/confirm
 * Confirm booking request and optionally create a rental
 */
router.post('/:id/confirm', async (req: Request, res: Response) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { id } = req.params
    const { createRental, clientId, adminNotes } = req.body

    // Get the booking request
    const requestResult = await client.query(
      'SELECT * FROM booking_requests WHERE id = $1 AND status = $2',
      [id, 'pending']
    )

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Pending booking request not found' })
    }

    const bookingRequest = requestResult.rows[0]

    let rentalId = null

    // Optionally create a rental
    if (createRental && clientId) {
      // Get vehicle info
      const vehicleResult = await client.query(
        'SELECT * FROM vehicles WHERE id = $1',
        [bookingRequest.vehicle_id]
      )

      if (vehicleResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ error: 'Vehicle not found' })
      }

      const vehicle = vehicleResult.rows[0]

      // Create the rental
      const rentalResult = await client.query(`
        INSERT INTO rentals (
          vehicle_id, client_id, start_date, planned_end_date,
          mileage_start, fuel_level_start, rate_type, rate_amount,
          deposit, payment_method, total_amount, notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
        RETURNING id
      `, [
        bookingRequest.vehicle_id,
        clientId,
        bookingRequest.start_date,
        bookingRequest.end_date,
        vehicle.mileage,
        100,
        'daily',
        vehicle.rate_daily,
        0,
        'cash',
        bookingRequest.total_price,
        `From booking: ${bookingRequest.reference_code}`,
      ])

      rentalId = rentalResult.rows[0].id

      // Update vehicle status
      await client.query(
        'UPDATE vehicles SET status = $1, updated_at = NOW() WHERE id = $2',
        ['rented', bookingRequest.vehicle_id]
      )
    }

    // Update booking request
    const updateResult = await client.query(`
      UPDATE booking_requests
      SET status = 'confirmed', admin_notes = $1, rental_id = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [adminNotes || null, rentalId, id])

    await client.query('COMMIT')

    const result = toCamelCase<Record<string, unknown>>(updateResult.rows[0])
    if (typeof result.additionalServices === 'string') {
      result.additionalServices = JSON.parse(result.additionalServices as string)
    }

    res.json(result)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error confirming booking request:', error)
    res.status(500).json({ error: 'Failed to confirm booking request' })
  } finally {
    client.release()
  }
})

/**
 * POST /api/booking-requests/:id/reject
 * Reject a booking request
 */
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { adminNotes } = req.body

    const result = await pool.query(`
      UPDATE booking_requests
      SET status = 'rejected', admin_notes = $1, updated_at = NOW()
      WHERE id = $2 AND status = 'pending'
      RETURNING *
    `, [adminNotes || null, id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pending booking request not found' })
    }

    const request = toCamelCase<Record<string, unknown>>(result.rows[0])
    if (typeof request.additionalServices === 'string') {
      request.additionalServices = JSON.parse(request.additionalServices as string)
    }

    res.json(request)
  } catch (error) {
    console.error('Error rejecting booking request:', error)
    res.status(500).json({ error: 'Failed to reject booking request' })
  }
})

/**
 * GET /api/booking-requests/stats
 * Get booking request statistics
 */
router.get('/stats/summary', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) as total_count
      FROM booking_requests
    `)

    res.json({
      pending: parseInt(result.rows[0].pending_count),
      confirmed: parseInt(result.rows[0].confirmed_count),
      rejected: parseInt(result.rows[0].rejected_count),
      completed: parseInt(result.rows[0].completed_count),
      total: parseInt(result.rows[0].total_count),
    })
  } catch (error) {
    console.error('Error fetching booking stats:', error)
    res.status(500).json({ error: 'Failed to fetch booking stats' })
  }
})

export default router
