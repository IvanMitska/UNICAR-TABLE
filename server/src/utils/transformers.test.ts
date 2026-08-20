import { describe, it, expect } from 'vitest'
import {
  generateReferenceCode,
  isVehicleAvailableForDates,
  toPublicCar,
  type VehicleRow,
} from './transformers.js'

describe('generateReferenceCode', () => {
  it('matches the UNI-YYYY-XXXXXX format', () => {
    const code = generateReferenceCode()
    expect(code).toMatch(/^UNI-\d{4}-[A-Z0-9]{6}$/)
  })

  it('embeds the current year', () => {
    const code = generateReferenceCode()
    const year = new Date().getFullYear()
    expect(code.startsWith(`UNI-${year}-`)).toBe(true)
  })

  it('produces (mostly) unique codes', () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generateReferenceCode()))
    // 1000 codes from 36^6 space: collisions are extremely unlikely.
    expect(codes.size).toBe(1000)
  })
})

describe('isVehicleAvailableForDates', () => {
  const d = (s: string) => new Date(s)

  it('returns false for vehicles in maintenance/archived', () => {
    expect(isVehicleAvailableForDates('maintenance', [], d('2026-07-01'), d('2026-07-05'))).toBe(false)
    expect(isVehicleAvailableForDates('archived', [], d('2026-07-01'), d('2026-07-05'))).toBe(false)
  })

  it('returns true for an available vehicle with no rentals', () => {
    expect(isVehicleAvailableForDates('available', [], d('2026-07-01'), d('2026-07-05'))).toBe(true)
  })

  it('detects an overlapping rental', () => {
    const rentals = [{ start_date: '2026-07-03', planned_end_date: '2026-07-10' }]
    expect(isVehicleAvailableForDates('available', rentals, d('2026-07-01'), d('2026-07-05'))).toBe(false)
  })

  it('allows a booking that ends exactly when another starts (no overlap)', () => {
    const rentals = [{ start_date: '2026-07-05', planned_end_date: '2026-07-10' }]
    expect(isVehicleAvailableForDates('available', rentals, d('2026-07-01'), d('2026-07-05'))).toBe(true)
  })

  it('allows a booking that starts exactly when another ends', () => {
    const rentals = [{ start_date: '2026-07-01', planned_end_date: '2026-07-05' }]
    expect(isVehicleAvailableForDates('available', rentals, d('2026-07-05'), d('2026-07-10'))).toBe(true)
  })

  it('detects a fully-enclosing requested range', () => {
    const rentals = [{ start_date: '2026-07-03', planned_end_date: '2026-07-04' }]
    expect(isVehicleAvailableForDates('available', rentals, d('2026-07-01'), d('2026-07-10'))).toBe(false)
  })

  it('treats a currently "rented" car as bookable for non-overlapping future dates', () => {
    const rentals = [{ start_date: '2026-06-01', planned_end_date: '2026-06-20' }]
    expect(isVehicleAvailableForDates('rented', rentals, d('2026-07-01'), d('2026-07-05'))).toBe(true)
  })
})

describe('toPublicCar', () => {
  const minimal: VehicleRow = {
    id: 7,
    brand: 'MG',
    model: '3',
    year: 2020,
    status: 'available',
  }

  it('falls back to the numeric id when a car has no websiteId', () => {
    expect(toPublicCar(minimal).id).toBe('7')
  })

  it('fills sensible defaults for missing metadata', () => {
    const car = toPublicCar(minimal)

    expect(car).toMatchObject({
      category: 'economy',
      pricePerDay: 0,
      image: '',
      images: [],
      features: [],
      transmission: 'automatic',
      fuel: 'petrol',
      seats: 5,
      luggage: 2,
      reviews: 0,
      longTermOnly: false,
      byRequest: false,
    })
    expect(car.specifications).toEqual({
      engine: '',
      power: '',
      acceleration: '',
      topSpeed: '',
    })
  })

  it('converts pg DECIMAL strings to numbers', () => {
    const car = toPublicCar({ ...minimal, rate_daily: '1500.00', rating: '4.5' })

    expect(car.pricePerDay).toBe(1500)
    expect(car.rating).toBe(4.5)
  })

  it('marks a rented car as unavailable', () => {
    expect(toPublicCar({ ...minimal, status: 'rented' }).available).toBe(false)
    expect(toPublicCar({ ...minimal, status: 'available' }).available).toBe(true)
  })

  it('uses the first image as the cover', () => {
    const car = toPublicCar({ ...minimal, images: ['/a.jpg', '/b.jpg'] })

    expect(car.image).toBe('/a.jpg')
    expect(car.images).toEqual(['/a.jpg', '/b.jpg'])
  })

  it('mirrors the single CRM description into both locales', () => {
    const car = toPublicCar({ ...minimal, description: 'Компактный хэтчбек' })

    expect(car.description).toEqual({ ru: 'Компактный хэтчбек', en: 'Компактный хэтчбек' })
  })

  it('passes the long-term flag through', () => {
    expect(toPublicCar({ ...minimal, long_term_only: true }).longTermOnly).toBe(true)
  })
})
