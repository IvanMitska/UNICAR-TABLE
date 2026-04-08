/**
 * Pricing calculation utilities
 * Synchronized with server and website logic
 */

/**
 * Smooth price grid for 1-30 days
 * Coefficients from base price for each day
 */
const DAILY_RATE_COEFFICIENTS: number[] = [
  1.0,      // 1 день - 100%
  0.9,      // 2 дня - 90%
  0.8,      // 3 дня - 80%
  0.7333,   // 4 дня - 73.3%
  0.6667,   // 5 дней - 66.7%
  0.6133,   // 6 дней - 61.3%
  0.5733,   // 7 дней - 57.3%
  0.56,     // 8 дней - 56%
  0.5467,   // 9 дней - 54.7%
  0.5333,   // 10 дней - 53.3%
  0.52,     // 11 дней - 52%
  0.5067,   // 12 дней - 50.7%
  0.4933,   // 13 дней - 49.3%
  0.48,     // 14 дней - 48%
  0.4667,   // 15 дней - 46.7%
  0.4533,   // 16 дней - 45.3%
  0.44,     // 17 дней - 44%
  0.4267,   // 18 дней - 42.7%
  0.4133,   // 19 дней - 41.3%
  0.4,      // 20 дней - 40%
  0.3867,   // 21 день - 38.7%
  0.38,     // 22 дня - 38%
  0.3733,   // 23 дня - 37.3%
  0.3667,   // 24 дня - 36.7%
  0.36,     // 25 дней - 36%
  0.3533,   // 26 дней - 35.3%
  0.3467,   // 27 дней - 34.7%
  0.3433,   // 28 дней - 34.3%
  0.34,     // 29 дней - 34%
  0.3333,   // 30 дней - 33.3%
]

/**
 * Returns daily rate based on rental duration
 * Uses smooth pricing grid where longer rentals get better rates
 */
export function getDailyRateForDuration(basePrice: number, days: number): number {
  if (days <= 0 || basePrice <= 0) return basePrice

  // For days 1-30, use coefficients from table
  if (days <= 30) {
    const coefficient = DAILY_RATE_COEFFICIENTS[days - 1]
    // Round to nearest 100 for nice prices
    return Math.round(basePrice * coefficient / 100) * 100
  }

  // For 30+ days, use minimum coefficient (33.3%)
  return Math.round(basePrice * 0.3333 / 100) * 100
}

/**
 * Calculate total rental price
 */
export function calculateTotalPrice(basePrice: number, days: number): number {
  const dailyRate = getDailyRateForDuration(basePrice, days)
  return dailyRate * days
}

/**
 * Get full pricing info for a rental
 */
export function getRentalPriceInfo(basePrice: number, days: number): {
  dailyRate: number
  totalPrice: number
  discountPercent: number
} {
  const dailyRate = getDailyRateForDuration(basePrice, days)
  const discountPercent = basePrice > 0
    ? Math.round((1 - dailyRate / basePrice) * 100)
    : 0

  return {
    dailyRate,
    totalPrice: dailyRate * days,
    discountPercent,
  }
}

/**
 * Calculate number of days between two dates
 */
export function calculateDays(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}
