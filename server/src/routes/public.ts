import { Router, Request, Response } from 'express'
import { pool } from '../db/database.js'
import {
  generateReferenceCode,
  isVehicleAvailableForDates,
  BookingRequestInput
} from '../utils/transformers.js'

const router = Router()

/**
 * Simple availability response
 */
interface VehicleAvailability {
  vehicleId: number
  websiteId: string | null
  available: boolean
}

/**
 * GET /api/public/availability
 * Get availability status for all vehicles
 * Returns only IDs and availability status - no prices, images, or details
 */
router.get('/availability', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id,
        v.status,
        m.website_id
      FROM vehicles v
      LEFT JOIN vehicle_metadata m ON v.id = m.vehicle_id
      WHERE v.status != 'archived'
        AND (m.is_visible IS NULL OR m.is_visible = true)
      ORDER BY v.id
    `)

    const availability: VehicleAvailability[] = result.rows.map(row => ({
      vehicleId: row.id,
      websiteId: row.website_id || null,
      available: row.status === 'available'
    }))

    res.json(availability)
  } catch (error) {
    console.error('Error fetching availability:', error)
    res.status(500).json({ error: 'Failed to fetch availability' })
  }
})

/**
 * GET /api/public/availability/check
 * Check which vehicles are available for specific date range
 * Query params: from, to (dates in YYYY-MM-DD format)
 */
router.get('/availability/check', async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query

    if (!from || !to) {
      return res.status(400).json({ error: 'Both "from" and "to" dates are required' })
    }

    const startDate = new Date(from as string)
    const endDate = new Date(to as string)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' })
    }

    if (startDate >= endDate) {
      return res.status(400).json({ error: '"from" date must be before "to" date' })
    }

    // Get all visible vehicles
    const vehiclesResult = await pool.query(`
      SELECT
        v.id,
        v.status,
        m.website_id
      FROM vehicles v
      LEFT JOIN vehicle_metadata m ON v.id = m.vehicle_id
      WHERE v.status IN ('available', 'rented')
        AND (m.is_visible IS NULL OR m.is_visible = true)
      ORDER BY v.id
    `)

    // Get all active rentals
    const rentalsResult = await pool.query(`
      SELECT vehicle_id, start_date, planned_end_date
      FROM rentals
      WHERE status = 'active'
    `)

    // Get all pending/confirmed booking requests
    const bookingRequestsResult = await pool.query(`
      SELECT vehicle_id, start_date, end_date
      FROM booking_requests
      WHERE status IN ('pending', 'confirmed')
    `)

    // Group rentals and booking requests by vehicle_id
    const rentalsByVehicle: Record<number, Array<{ start_date: string; planned_end_date: string }>> = {}

    for (const rental of rentalsResult.rows) {
      if (!rentalsByVehicle[rental.vehicle_id]) {
        rentalsByVehicle[rental.vehicle_id] = []
      }
      rentalsByVehicle[rental.vehicle_id].push({
        start_date: rental.start_date,
        planned_end_date: rental.planned_end_date
      })
    }

    for (const booking of bookingRequestsResult.rows) {
      if (!rentalsByVehicle[booking.vehicle_id]) {
        rentalsByVehicle[booking.vehicle_id] = []
      }
      rentalsByVehicle[booking.vehicle_id].push({
        start_date: booking.start_date,
        planned_end_date: booking.end_date
      })
    }

    // Check availability for each vehicle
    const availability = vehiclesResult.rows.map(row => {
      const vehicleRentals = rentalsByVehicle[row.id] || []
      const availableForDates = isVehicleAvailableForDates(
        row.status,
        vehicleRentals,
        startDate,
        endDate
      )

      return {
        vehicleId: row.id,
        websiteId: row.website_id || null,
        availableForDates
      }
    })

    res.json(availability)
  } catch (error) {
    console.error('Error checking availability:', error)
    res.status(500).json({ error: 'Failed to check availability' })
  }
})

/**
 * GET /api/public/availability/:id
 * Get availability status for a single vehicle by websiteId or vehicleId
 */
router.get('/availability/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await pool.query(`
      SELECT
        v.id,
        v.status,
        m.website_id
      FROM vehicles v
      LEFT JOIN vehicle_metadata m ON v.id = m.vehicle_id
      WHERE (m.website_id = $1 OR v.id::text = $1)
        AND v.status != 'archived'
        AND (m.is_visible IS NULL OR m.is_visible = true)
      LIMIT 1
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    const row = result.rows[0]
    res.json({
      vehicleId: row.id,
      websiteId: row.website_id || null,
      available: row.status === 'available'
    })
  } catch (error) {
    console.error('Error fetching vehicle availability:', error)
    res.status(500).json({ error: 'Failed to fetch availability' })
  }
})

/**
 * POST /api/public/bookings
 * Create a new booking request from website
 */
router.post('/bookings', async (req: Request, res: Response) => {
  try {
    const data: BookingRequestInput = req.body

    // Validate required fields
    if (!data.vehicleId || !data.customerFirstName || !data.customerLastName ||
        !data.customerEmail || !data.customerPhone || !data.startDate ||
        !data.endDate || !data.pickupLocation || !data.returnLocation) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validate dates
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' })
    }

    if (startDate >= endDate) {
      return res.status(400).json({ error: 'Start date must be before end date' })
    }

    if (startDate < new Date()) {
      return res.status(400).json({ error: 'Start date cannot be in the past' })
    }

    // Check if vehicle exists - search by websiteId first, then by numeric id
    let vehicleResult = await pool.query(`
      SELECT v.id, v.status
      FROM vehicles v
      JOIN vehicle_metadata m ON v.id = m.vehicle_id
      WHERE m.website_id = $1 AND v.status != 'archived'
    `, [data.vehicleId])

    // If not found by websiteId, try numeric id
    if (vehicleResult.rows.length === 0) {
      vehicleResult = await pool.query(
        'SELECT id, status FROM vehicles WHERE id::text = $1 AND status != $2',
        [String(data.vehicleId), 'archived']
      )
    }

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    const vehicleId = vehicleResult.rows[0].id

    // Check availability
    const rentalsResult = await pool.query(`
      SELECT start_date, planned_end_date
      FROM rentals
      WHERE vehicle_id = $1 AND status = 'active'
    `, [vehicleId])

    const bookingsResult = await pool.query(`
      SELECT start_date, end_date as planned_end_date
      FROM booking_requests
      WHERE vehicle_id = $1 AND status IN ('pending', 'confirmed')
    `, [vehicleId])

    const existingBookings = [
      ...rentalsResult.rows,
      ...bookingsResult.rows
    ]

    const isAvailable = isVehicleAvailableForDates(
      vehicleResult.rows[0].status,
      existingBookings,
      startDate,
      endDate
    )

    if (!isAvailable) {
      return res.status(409).json({ error: 'Vehicle is not available for selected dates' })
    }

    // Generate reference code
    const referenceCode = generateReferenceCode()

    // Create booking request
    const result = await pool.query(`
      INSERT INTO booking_requests (
        reference_code,
        vehicle_id,
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        customer_birth_date,
        customer_license_number,
        customer_license_issue_date,
        start_date,
        end_date,
        pickup_location,
        return_location,
        additional_services,
        total_price,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending')
      RETURNING *
    `, [
      referenceCode,
      vehicleId,
      data.customerFirstName,
      data.customerLastName,
      data.customerEmail,
      data.customerPhone,
      data.customerBirthDate || null,
      data.customerLicenseNumber || null,
      data.customerLicenseIssueDate || null,
      startDate,
      endDate,
      data.pickupLocation,
      data.returnLocation,
      JSON.stringify(data.additionalServices || []),
      data.totalPrice || 0
    ])

    res.status(201).json({
      referenceCode: result.rows[0].reference_code,
      status: result.rows[0].status,
      message: 'Booking request created successfully'
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    res.status(500).json({ error: 'Failed to create booking' })
  }
})

/**
 * GET /api/public/bookings/:ref/status
 * Get booking status by reference code
 */
router.get('/bookings/:ref/status', async (req: Request, res: Response) => {
  try {
    const { ref } = req.params

    const result = await pool.query(`
      SELECT
        br.reference_code,
        br.status,
        br.start_date,
        br.end_date,
        br.pickup_location,
        br.return_location,
        br.created_at,
        v.id as vehicle_id,
        m.website_id
      FROM booking_requests br
      JOIN vehicles v ON br.vehicle_id = v.id
      LEFT JOIN vehicle_metadata m ON v.id = m.vehicle_id
      WHERE br.reference_code = $1
    `, [ref])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const row = result.rows[0]
    res.json({
      referenceCode: row.reference_code,
      status: row.status,
      vehicleId: row.vehicle_id,
      websiteId: row.website_id || null,
      startDate: row.start_date,
      endDate: row.end_date,
      pickupLocation: row.pickup_location,
      returnLocation: row.return_location,
      createdAt: row.created_at
    })
  } catch (error) {
    console.error('Error fetching booking status:', error)
    res.status(500).json({ error: 'Failed to fetch booking status' })
  }
})

export default router
