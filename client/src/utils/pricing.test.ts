import { describe, it, expect } from 'vitest'
import { calculateDays, getRentalPriceInfo } from './pricing'

describe('calculateDays', () => {
  it('counts a simple multi-day span', () => {
    expect(calculateDays('2026-07-01', '2026-07-05')).toBe(4)
  })

  it('returns at least 1 day for the same date', () => {
    expect(calculateDays('2026-07-01', '2026-07-01')).toBe(1)
  })

  it('accepts Date objects', () => {
    expect(calculateDays(new Date('2026-07-01'), new Date('2026-07-03'))).toBe(2)
  })

  it('rounds a partial day up', () => {
    // 1.5 days -> 2
    expect(calculateDays('2026-07-01T00:00:00Z', '2026-07-02T12:00:00Z')).toBe(2)
  })

  // --- Edge cases that probe for bugs ---

  it('KNOWN ISSUE: reversed dates are billed as a positive span', () => {
    // Because the function uses Math.abs, swapping start/end still yields a
    // positive number of days instead of rejecting the invalid range.
    // Documents current behaviour; the server route (rentals.ts) does NOT use
    // abs() and would clamp this to 1 instead — the two are inconsistent.
    expect(calculateDays('2026-07-05', '2026-07-01')).toBe(4)
  })
})

describe('client getRentalPriceInfo parity', () => {
  it('matches the documented 2-day discount', () => {
    const info = getRentalPriceInfo(2000, 2)
    expect(info.dailyRate).toBe(1800)
    expect(info.totalPrice).toBe(3600)
  })
})
