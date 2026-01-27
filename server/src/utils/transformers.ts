/**
 * Transformers for public API responses
 * Converts CRM vehicle data to website-compatible format
 */

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
  rate_daily: string
  rate_3days: string
  rate_7days: string
  rate_monthly: string
  insurance_expiry: string | null
  inspection_expiry: string | null
  photo_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface MetadataRow {
  id: number
  vehicle_id: number
  website_id: string
  category: string
  images: string[]
  features: string[]
  specifications: Record<string, string>
  seats: number
  luggage: number
  rating: string
  reviews: number
  description: string | null
  transmission: string
  is_visible: boolean
  display_order: number
  price_by_request: boolean
  long_term_only: boolean
}

export interface WebsiteCar {
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
  description: string
  color: string
  licensePlate: string
  longTermOnly: boolean
  byRequest: boolean
  specifications: {
    engine: string
    power: string
    acceleration: string
    topSpeed: string
  }
  rates: {
    daily: number
    threeDays: number
    sevenDays: number
    monthly: number
  }
}

export interface BookingRequestInput {
  vehicleId: number
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
  totalPrice: number
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
 * Transform vehicle + metadata rows to website car format
 */
export function transformToWebsiteCar(
  vehicle: VehicleRow,
  metadata: MetadataRow | null
): WebsiteCar {
  const defaultSpecs = {
    engine: '',
    power: '',
    acceleration: '',
    topSpeed: ''
  }

  const specs = metadata?.specifications as Record<string, string> | null

  return {
    id: metadata?.website_id || `v-${vehicle.id}`,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    category: metadata?.category || 'economy',
    pricePerDay: parseFloat(vehicle.rate_daily) || 0,
    image: metadata?.images?.[0] || vehicle.photo_url || '/images/car-placeholder.jpg',
    images: metadata?.images || (vehicle.photo_url ? [vehicle.photo_url] : []),
    features: metadata?.features || [],
    transmission: metadata?.transmission || 'automatic',
    fuel: vehicle.fuel_type,
    seats: metadata?.seats || 5,
    luggage: metadata?.luggage || 2,
    available: vehicle.status === 'available',
    rating: parseFloat(metadata?.rating || '4.5'),
    reviews: metadata?.reviews || 0,
    description: metadata?.description || '',
    color: vehicle.color,
    licensePlate: vehicle.license_plate,
    longTermOnly: metadata?.long_term_only || false,
    byRequest: metadata?.price_by_request || false,
    specifications: {
      engine: specs?.engine || defaultSpecs.engine,
      power: specs?.power || defaultSpecs.power,
      acceleration: specs?.acceleration || defaultSpecs.acceleration,
      topSpeed: specs?.topSpeed || defaultSpecs.topSpeed
    },
    rates: {
      daily: parseFloat(vehicle.rate_daily) || 0,
      threeDays: parseFloat(vehicle.rate_3days) || 0,
      sevenDays: parseFloat(vehicle.rate_7days) || 0,
      monthly: parseFloat(vehicle.rate_monthly) || 0
    }
  }
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
