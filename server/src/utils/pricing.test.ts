import { describe, it, expect } from 'vitest'
import {
  getDailyRateForDuration,
  calculateTotalPrice,
  getRentalPriceInfo,
} from './pricing.js'

describe('getDailyRateForDuration', () => {
  it('returns full base price for 1 day', () => {
    expect(getDailyRateForDuration(2000, 1)).toBe(2000)
  })

  it('applies the 2-day coefficient (90%)', () => {
    // 2000 * 0.9 = 1800, rounded to nearest 100 -> 1800
    expect(getDailyRateForDuration(2000, 2)).toBe(1800)
  })

  it('applies the 30-day coefficient (33.3%)', () => {
    // 2000 * 0.3333 = 666.6 -> round(/100)*100 = 700
    expect(getDailyRateForDuration(2000, 30)).toBe(700)
  })

  it('uses minimum coefficient for >30 days', () => {
    expect(getDailyRateForDuration(2000, 45)).toBe(700)
  })

  it('returns a value rounded to the nearest 100', () => {
    const rate = getDailyRateForDuration(3333, 7)
    expect(rate % 100).toBe(0)
  })

  // --- Edge cases that probe for bugs ---

  it('handles zero days without returning a nonsensical rate', () => {
    // Documents current behaviour: days <= 0 returns the raw base price.
    expect(getDailyRateForDuration(2000, 0)).toBe(2000)
  })

  it('handles negative days', () => {
    expect(getDailyRateForDuration(2000, -5)).toBe(2000)
  })

  it('KNOWN ISSUE: collapses very small base prices to zero on long rentals', () => {
    // 150 * 0.3333 = 49.99 -> round(0.4999)*100 = 0  => daily rate becomes 0!
    // Not reachable with realistic car prices (thousands of THB), but the
    // "round to nearest 100" step has no floor. Documented, not yet fixed.
    expect(getDailyRateForDuration(150, 30)).toBe(0)
  })
})

describe('calculateTotalPrice', () => {
  it('multiplies the discounted daily rate by the number of days', () => {
    // 7 days at 2000 base: rate = round(2000*0.5733/100)*100 = round(11.466)*100 = 1100
    // total = 1100 * 7 = 7700
    expect(calculateTotalPrice(2000, 7)).toBe(7700)
  })

  it('a longer rental should never cost less in total than a shorter one (monotonicity)', () => {
    // BUG PROBE: because the daily rate drops with duration, total price can be
    // non-monotonic. Verify 4 days never costs less than 3 days for the same car.
    const base = 2000
    const threeDays = calculateTotalPrice(base, 3)
    const fourDays = calculateTotalPrice(base, 4)
    expect(fourDays).toBeGreaterThanOrEqual(threeDays)
  })
})

describe('getRentalPriceInfo', () => {
  it('computes daily rate, total and discount percent together', () => {
    const info = getRentalPriceInfo(2000, 2)
    expect(info.dailyRate).toBe(1800)
    expect(info.totalPrice).toBe(3600)
    expect(info.discountPercent).toBe(10)
  })

  it('reports 0% discount for a 1-day rental', () => {
    const info = getRentalPriceInfo(2000, 1)
    expect(info.discountPercent).toBe(0)
  })

  it('handles base price of 0 without dividing by zero', () => {
    const info = getRentalPriceInfo(0, 5)
    expect(info.discountPercent).toBe(0)
    expect(Number.isNaN(info.totalPrice)).toBe(false)
  })
})
