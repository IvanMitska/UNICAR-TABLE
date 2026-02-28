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
