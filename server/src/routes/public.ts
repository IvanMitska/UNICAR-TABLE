import { Router, Request, Response } from 'express'
import { pool, toCamelCase } from '../db/database.js'
import {
  transformToWebsiteCar,
  generateReferenceCode,
  isVehicleAvailableForDates,
  WebsiteCar,
  BookingRequestInput
} from '../utils/transformers.js'

const router = Router()

/**
 * GET /api/public/cars
 * Get all visible cars for website display
 */
router.get('/cars', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        v.*,
        m.id as meta_id,
        m.website_id,
        m.category,
        m.images,
        m.features,
        m.specifications,
        m.seats,
        m.luggage,
        m.rating,
        m.reviews,
        m.description as meta_description,
        m.transmission,
        m.is_visible,
        m.display_order,
        m.price_by_request,
        m.long_term_only
      FROM vehicles v
      LEFT JOIN vehicle_metadata m ON v.id = m.vehicle_id
      WHERE v.status != 'archived'
        AND (m.is_visible IS NULL OR m.is_visible = true)
      ORDER BY COALESCE(m.display_order, 999), v.brand, v.model
    `)

    const cars: WebsiteCar[] = result.rows.map(row => {
      const vehicle = {
        id: row.id,
        brand: row.brand,
        model: row.model,
        license_plate: row.license_plate,
        vin: row.vin,
        year: row.year,
        color: row.color,
        fuel_type: row.fuel_type,
        mileage: row.mileage,
        status: row.status,
        rate_daily: row.rate_daily,
        rate_3days: row.rate_3days,
        rate_7days: row.rate_7days,
        rate_monthly: row.rate_monthly,
        insurance_expiry: row.insurance_expiry,
        inspection_expiry: row.inspection_expiry,
        photo_url: row.photo_url,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at
      }

      const metadata = row.meta_id ? {
        id: row.meta_id,
        vehicle_id: row.id,
        website_id: row.website_id,
        category: row.category,
        images: row.images || [],
        features: row.features || [],
        specifications: row.specifications || {},
        seats: row.seats,
        luggage: row.luggage,
        rating: row.rating,
        reviews: row.reviews,
        description: row.meta_description,
        transmission: row.transmission,
        is_visible: row.is_visible,
        display_order: row.display_order,
        price_by_request: row.price_by_request,
        long_term_only: row.long_term_only
      } : null

      return transformToWebsiteCar(vehicle, metadata)
    })

    res.json(cars)
  } catch (error) {
    console.error('Error fetching cars:', error)
    res.status(500).json({ error: 'Failed to fetch cars' })
  }
})

/**
 * GET /api/public/cars/:id
 * Get single car by website_id or vehicle id
 */
router.get('/cars/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Try to find by website_id first, then by vehicle id
    const result = await pool.query(`
      SELECT
        v.*,
        m.id as meta_id,
        m.website_id,
        m.category,
        m.images,
        m.features,
        m.specifications,
        m.seats,
        m.luggage,
        m.rating,
        m.reviews,
        m.description as meta_description,
        m.transmission,
        m.is_visible,
        m.display_order,
        m.price_by_request,
        m.long_term_only
      FROM vehicles v
      LEFT JOIN vehicle_metadata m ON v.id = m.vehicle_id
      WHERE (m.website_id = $1 OR v.id::text = $1)
        AND v.status != 'archived'
        AND (m.is_visible IS NULL OR m.is_visible = true)
      LIMIT 1
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' })
    }

    const row = result.rows[0]
    const vehicle = {
      id: row.id,
      brand: row.brand,
      model: row.model,
      license_plate: row.license_plate,
      vin: row.vin,
      year: row.year,
      color: row.color,
      fuel_type: row.fuel_type,
      mileage: row.mileage,
      status: row.status,
      rate_daily: row.rate_daily,
      rate_3days: row.rate_3days,
      rate_7days: row.rate_7days,
      rate_monthly: row.rate_monthly,
      insurance_expiry: row.insurance_expiry,
      inspection_expiry: row.inspection_expiry,
      photo_url: row.photo_url,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    }

    const metadata = row.meta_id ? {
      id: row.meta_id,
      vehicle_id: row.id,
      website_id: row.website_id,
      category: row.category,
      images: row.images || [],
      features: row.features || [],
      specifications: row.specifications || {},
      seats: row.seats,
      luggage: row.luggage,
      rating: row.rating,
      reviews: row.reviews,
      description: row.meta_description,
      transmission: row.transmission,
      is_visible: row.is_visible,
      display_order: row.display_order,
      price_by_request: row.price_by_request,
      long_term_only: row.long_term_only
    } : null

    res.json(transformToWebsiteCar(vehicle, metadata))
  } catch (error) {
    console.error('Error fetching car:', error)
    res.status(500).json({ error: 'Failed to fetch car' })
  }
})

/**
 * GET /api/public/cars/available
 * Get cars available for specific date range
 */
router.get('/cars/available', async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query

    if (!from || !to) {
      return res.status(400).json({ error: 'Both "from" and "to" dates are required' })
    }

    const startDate = new Date(from as string)
    const endDate = new Date(to as string)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' })
    }

    if (startDate >= endDate) {
      return res.status(400).json({ error: '"from" date must be before "to" date' })
    }

    // Get all vehicles with their rentals
    const vehiclesResult = await pool.query(`
      SELECT
        v.*,
        m.id as meta_id,
        m.website_id,
        m.category,
        m.images,
        m.features,
        m.specifications,
        m.seats,
        m.luggage,
        m.rating,
        m.reviews,
        m.description as meta_description,
        m.transmission,
        m.is_visible,
        m.display_order,
        m.price_by_request,
        m.long_term_only
      FROM vehicles v
      LEFT JOIN vehicle_metadata m ON v.id = m.vehicle_id
      WHERE v.status IN ('available', 'rented')
        AND v.status != 'archived'
        AND (m.is_visible IS NULL OR m.is_visible = true)
      ORDER BY COALESCE(m.display_order, 999), v.brand, v.model
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

    // Filter available vehicles
    const availableCars: WebsiteCar[] = []

    for (const row of vehiclesResult.rows) {
      const vehicleRentals = rentalsByVehicle[row.id] || []
      const isAvailable = isVehicleAvailableForDates(
        row.status,
        vehicleRentals,
        startDate,
        endDate
      )

      if (isAvailable) {
        const vehicle = {
          id: row.id,
          brand: row.brand,
          model: row.model,
          license_plate: row.license_plate,
          vin: row.vin,
          year: row.year,
          color: row.color,
          fuel_type: row.fuel_type,
          mileage: row.mileage,
          status: row.status,
          rate_daily: row.rate_daily,
          rate_3days: row.rate_3days,
          rate_7days: row.rate_7days,
          rate_monthly: row.rate_monthly,
          insurance_expiry: row.insurance_expiry,
          inspection_expiry: row.inspection_expiry,
          photo_url: row.photo_url,
          notes: row.notes,
          created_at: row.created_at,
          updated_at: row.updated_at
        }

        const metadata = row.meta_id ? {
          id: row.meta_id,
          vehicle_id: row.id,
          website_id: row.website_id,
          category: row.category,
          images: row.images || [],
          features: row.features || [],
          specifications: row.specifications || {},
          seats: row.seats,
          luggage: row.luggage,
          rating: row.rating,
          reviews: row.reviews,
          description: row.meta_description,
          transmission: row.transmission,
          is_visible: row.is_visible,
          display_order: row.display_order,
          price_by_request: row.price_by_request,
          long_term_only: row.long_term_only
        } : null

        availableCars.push(transformToWebsiteCar(vehicle, metadata))
      }
    }

    res.json(availableCars)
  } catch (error) {
    console.error('Error checking availability:', error)
    res.status(500).json({ error: 'Failed to check availability' })
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

    // Check if vehicle exists
    const vehicleResult = await pool.query(
      'SELECT id, status FROM vehicles WHERE id = $1 AND status != $2',
      [data.vehicleId, 'archived']
    )

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    // Check availability
    const rentalsResult = await pool.query(`
      SELECT start_date, planned_end_date
      FROM rentals
      WHERE vehicle_id = $1 AND status = 'active'
    `, [data.vehicleId])

    const bookingsResult = await pool.query(`
      SELECT start_date, end_date as planned_end_date
      FROM booking_requests
      WHERE vehicle_id = $1 AND status IN ('pending', 'confirmed')
    `, [data.vehicleId])

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
      data.vehicleId,
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
        br.total_price,
        br.created_at,
        v.brand,
        v.model,
        v.year
      FROM booking_requests br
      JOIN vehicles v ON br.vehicle_id = v.id
      WHERE br.reference_code = $1
    `, [ref])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const row = result.rows[0]
    res.json({
      referenceCode: row.reference_code,
      status: row.status,
      vehicle: {
        brand: row.brand,
        model: row.model,
        year: row.year
      },
      startDate: row.start_date,
      endDate: row.end_date,
      pickupLocation: row.pickup_location,
      returnLocation: row.return_location,
      totalPrice: parseFloat(row.total_price),
      createdAt: row.created_at
    })
  } catch (error) {
    console.error('Error fetching booking status:', error)
    res.status(500).json({ error: 'Failed to fetch booking status' })
  }
})

export default router
