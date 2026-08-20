import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The route module imports a live pg Pool; swap it for a queue of canned
// results so the public API can be exercised without a database.
const query = vi.fn()
vi.mock('../db/database.js', () => ({ pool: { query: (...args: unknown[]) => query(...args) } }))

const { default: publicRoutes } = await import('./public.js')

const app = express()
app.use(express.json())
app.use('/api/public', publicRoutes)

/** Queues query results in the order the route will ask for them. */
function queueRows(...results: unknown[][]) {
  for (const rows of results) query.mockResolvedValueOnce({ rows })
}

const carRow = {
  id: 55,
  brand: 'Toyota',
  model: 'Fortuner',
  year: 2017,
  color: 'Grey',
  fuel_type: 'diesel',
  status: 'available',
  rate_daily: '7000.00',
  license_plate: 'UNI0055',
  website_id: 'fortuner',
  category: 'suv',
  images: ['/images/cars/fortuner/g0.jpg'],
  features: ['4WD'],
  specifications: { engine: '2.8L', power: '177 hp', acceleration: '11 sec', topSpeed: '180 km/h' },
  seats: 7,
  luggage: 3,
  rating: '4.7',
  reviews: 42,
  description: 'Надёжный внедорожник',
  transmission: 'automatic',
  price_by_request: false,
  long_term_only: false,
}

beforeEach(() => {
  query.mockReset()
})

describe('GET /api/public/cars', () => {
  it('returns the catalogue in the website shape', async () => {
    queueRows([carRow])

    const res = await request(app).get('/api/public/cars')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toMatchObject({
      id: 'fortuner',
      brand: 'Toyota',
      pricePerDay: 7000,
      rating: 4.7,
      seats: 7,
      available: true,
      longTermOnly: false,
      description: { ru: 'Надёжный внедорожник', en: 'Надёжный внедорожник' },
      specifications: { engine: '2.8L', power: '177 hp' },
    })
  })

  it('hides archived and invisible cars at the SQL level', async () => {
    queueRows([])

    await request(app).get('/api/public/cars')

    const sql = String(query.mock.calls[0][0])
    expect(sql).toContain("v.status != 'archived'")
    expect(sql).toContain('m.is_visible = true')
  })

  it('answers 500 when the database is unreachable', async () => {
    query.mockRejectedValueOnce(new Error('connection refused'))

    const res = await request(app).get('/api/public/cars')

    expect(res.status).toBe(500)
  })
})

describe('GET /api/public/cars/:id', () => {
  it('finds a car by websiteId', async () => {
    queueRows([carRow])

    const res = await request(app).get('/api/public/cars/fortuner')

    expect(res.status).toBe(200)
    expect(res.body.id).toBe('fortuner')
    expect(query.mock.calls[0][1]).toEqual(['fortuner'])
  })

  it('answers 404 for an unknown id', async () => {
    queueRows([])

    const res = await request(app).get('/api/public/cars/does-not-exist')

    expect(res.status).toBe(404)
  })

  it('does not swallow the /cars/available route', async () => {
    // /cars/available must be matched before /cars/:id, otherwise the
    // literal "available" would be looked up as a car id.
    const res = await request(app).get('/api/public/cars/available')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/startDate/)
  })
})

describe('GET /api/public/cars/available', () => {
  it('drops cars that are occupied for the requested range', async () => {
    queueRows(
      [carRow, { ...carRow, id: 56, website_id: 'juke-1' }],
      [], // rentals
      [{ vehicle_id: 55, start_date: '2026-09-10', end_date: '2026-09-15' }] // booking requests
    )

    const res = await request(app)
      .get('/api/public/cars/available')
      .query({ startDate: '2026-09-12', endDate: '2026-09-14' })

    expect(res.status).toBe(200)
    expect(res.body.map((c: { id: string }) => c.id)).toEqual(['juke-1'])
  })

  it('keeps cars whose booking ends exactly when the range starts', async () => {
    queueRows(
      [carRow],
      [],
      [{ vehicle_id: 55, start_date: '2026-09-01', end_date: '2026-09-12' }]
    )

    const res = await request(app)
      .get('/api/public/cars/available')
      .query({ startDate: '2026-09-12', endDate: '2026-09-14' })

    expect(res.body.map((c: { id: string }) => c.id)).toEqual(['fortuner'])
  })

  it('rejects a reversed range', async () => {
    const res = await request(app)
      .get('/api/public/cars/available')
      .query({ startDate: '2026-09-14', endDate: '2026-09-12' })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/public/bookings/:ref/cancel', () => {
  it('cancels a pending request', async () => {
    queueRows(
      [{ id: 1, status: 'pending' }],
      [{ reference_code: 'UNI-2026-ABC123', status: 'cancelled' }]
    )

    const res = await request(app).post('/api/public/bookings/UNI-2026-ABC123/cancel')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ referenceCode: 'UNI-2026-ABC123', status: 'cancelled' })
  })

  it('answers 404 for an unknown reference code', async () => {
    queueRows([])

    const res = await request(app).post('/api/public/bookings/UNI-2026-NOPE00/cancel')

    expect(res.status).toBe(404)
  })

  it('refuses to cancel a confirmed booking', async () => {
    queueRows([{ id: 1, status: 'confirmed' }])

    const res = await request(app).post('/api/public/bookings/UNI-2026-ABC123/cancel')

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/cannot be cancelled/)
  })

  it('is idempotent for an already cancelled booking', async () => {
    queueRows([{ id: 1, status: 'cancelled' }])

    const res = await request(app).post('/api/public/bookings/UNI-2026-ABC123/cancel')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('cancelled')
    // No UPDATE should have been issued — only the initial SELECT.
    expect(query).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/public/bookings', () => {
  const validBody = {
    vehicleId: 'fortuner',
    customerFirstName: 'Иван',
    customerLastName: 'Петров',
    customerEmail: 'ivan@example.com',
    customerPhone: '+66900000000',
    startDate: '2099-09-10',
    endDate: '2099-09-15',
    pickupLocation: 'Аэропорт Пхукет',
    returnLocation: 'Аэропорт Пхукет',
    totalPrice: 30000,
  }

  it('rejects an incomplete payload before touching the database', async () => {
    const res = await request(app)
      .post('/api/public/bookings')
      .send({ ...validBody, customerEmail: undefined })

    expect(res.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('rejects a start date in the past', async () => {
    const res = await request(app)
      .post('/api/public/bookings')
      .send({ ...validBody, startDate: '2020-01-01', endDate: '2020-01-05' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/past/)
  })

  it('rejects an end date before the start date', async () => {
    const res = await request(app)
      .post('/api/public/bookings')
      .send({ ...validBody, startDate: '2099-09-15', endDate: '2099-09-10' })

    expect(res.status).toBe(400)
  })

  it('answers 404 when the vehicle is unknown', async () => {
    queueRows([], []) // websiteId lookup, then numeric id lookup

    const res = await request(app).post('/api/public/bookings').send(validBody)

    expect(res.status).toBe(404)
  })

  it('answers 409 when the car is taken for those dates', async () => {
    queueRows(
      [{ id: 55, status: 'available' }],
      [], // rentals
      [{ start_date: '2099-09-01', planned_end_date: '2099-09-20' }] // overlapping request
    )

    const res = await request(app).post('/api/public/bookings').send(validBody)

    expect(res.status).toBe(409)
  })

  it('stores the request and returns a reference code', async () => {
    queueRows(
      [{ id: 55, status: 'available' }],
      [],
      [],
      [{ reference_code: 'UNI-2026-ABC123', status: 'pending' }]
    )

    const res = await request(app).post('/api/public/bookings').send(validBody)

    expect(res.status).toBe(201)
    expect(res.body.referenceCode).toMatch(/^UNI-\d{4}-[A-Z0-9]{6}$/)

    // Additional services are persisted as JSON so the manager sees them.
    const insertParams = query.mock.calls[3][1] as unknown[]
    expect(insertParams).toContain('Аэропорт Пхукет')
    expect(insertParams.some(p => typeof p === 'string' && p.startsWith('['))).toBe(true)
  })
})
