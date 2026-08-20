/**
 * Utilities for public API
 */

export interface BookingRequestInput {
  vehicleId: string | number
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  customerBirthDate?: string
  customerLicenseNumber?: string
  customerLicenseIssueDate?: string
  startDate: string
  endDate: string
  pickupLocation: string
  returnLocation: string
  additionalServices?: Array<{
    id: string
    name: string
    price: number
    perDay: boolean
  }>
  totalPrice?: number
}

/**
 * Generate a unique reference code for booking requests
 * Format: UNI-YYYY-XXXXXX (e.g., UNI-2026-ABC123)
 */
export function generateReferenceCode(): string {
  const year = new Date().getFullYear()
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `UNI-${year}-${code}`
}

/**
 * Check if vehicle is available for given date range
 */
export function isVehicleAvailableForDates(
  vehicleStatus: string,
  existingRentals: Array<{ start_date: string; planned_end_date: string }>,
  startDate: Date,
  endDate: Date
): boolean {
  if (vehicleStatus !== 'available' && vehicleStatus !== 'rented') {
    return false
  }

  // Check for overlapping rentals
  for (const rental of existingRentals) {
    const rentalStart = new Date(rental.start_date)
    const rentalEnd = new Date(rental.planned_end_date)

    // Check if date ranges overlap
    if (startDate < rentalEnd && endDate > rentalStart) {
      return false
    }
  }

  return true
}

/**
 * Car in the shape the website and the mobile app consume.
 * Mirrors UNICAR-WEB/src/types/index.ts.
 */
export interface PublicCar {
  id: string
  brand: string
  model: string
  year: number
  category: string
  pricePerDay: number
  image: string
  images: string[]
  features: string[]
  transmission: string
  fuel: string
  seats: number
  luggage: number
  available: boolean
  rating: number
  reviews: number
  description: { ru: string; en: string }
  color?: string
  licensePlate?: string
  longTermOnly: boolean
  byRequest: boolean
  specifications: {
    engine: string
    power: string
    acceleration: string
    topSpeed: string
  }
}

/** Row of `vehicles` joined with `vehicle_metadata`. */
export interface VehicleRow {
  id: number
  brand: string
  model: string
  year: number
  color?: string | null
  fuel_type?: string | null
  status: string
  rate_daily?: string | number | null
  license_plate?: string | null
  website_id?: string | null
  category?: string | null
  images?: string[] | null
  features?: string[] | null
  specifications?: Record<string, unknown> | null
  seats?: number | null
  luggage?: number | null
  rating?: string | number | null
  reviews?: number | null
  description?: string | null
  transmission?: string | null
  price_by_request?: boolean | null
  long_term_only?: boolean | null
}

/** pg returns DECIMAL columns as strings — normalise them to numbers. */
function toNumber(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function spec(specifications: Record<string, unknown> | null | undefined, key: string): string {
  const value = specifications?.[key]
  return typeof value === 'string' ? value : ''
}

/**
 * Maps a database row to the public catalogue shape.
 *
 * `id` is the website id so that the website, the app and the CRM all refer to
 * a car the same way; the numeric vehicle id stays inside the CRM.
 */
export function toPublicCar(row: VehicleRow): PublicCar {
  const images = row.images ?? []
  const description = row.description ?? ''

  return {
    id: row.website_id || String(row.id),
    brand: row.brand,
    model: row.model,
    year: row.year,
    category: row.category || 'economy',
    pricePerDay: toNumber(row.rate_daily),
    image: images[0] ?? '',
    images,
    features: row.features ?? [],
    transmission: row.transmission || 'automatic',
    fuel: row.fuel_type || 'petrol',
    seats: row.seats ?? 5,
    luggage: row.luggage ?? 2,
    available: row.status === 'available',
    rating: toNumber(row.rating, 0),
    reviews: row.reviews ?? 0,
    // В CRM описание одно, без переводов — отдаём его в обе локали.
    description: { ru: description, en: description },
    color: row.color ?? undefined,
    licensePlate: row.license_plate ?? undefined,
    longTermOnly: Boolean(row.long_term_only),
    byRequest: Boolean(row.price_by_request),
    specifications: {
      engine: spec(row.specifications, 'engine'),
      power: spec(row.specifications, 'power'),
      acceleration: spec(row.specifications, 'acceleration'),
      topSpeed: spec(row.specifications, 'topSpeed'),
    },
  }
}
