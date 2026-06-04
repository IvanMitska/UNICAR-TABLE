import { describe, it, expect } from 'vitest'
import { getDailyRateForDuration, calculateTotalPrice, getRentalPriceInfo, calculateDays } from './pricing'

describe('pricing: getDailyRateForDuration', () => {
  it('returns full base price for 1 day', () => {
    expect(getDailyRateForDuration(2500, 1)).toBe(2500)
  })
  it('applies the discount grid (3 days = 80%)', () => {
    expect(getDailyRateForDuration(2500, 3)).toBe(2000)
  })
  it('rounds to nearest 100', () => {
    // 2500 * 0.6667 = 1666.75 -> round(16.6675)*100 = 1700
    expect(getDailyRateForDuration(2500, 5)).toBe(1700)
  })
  it('uses minimum coefficient beyond 30 days', () => {
    // 2500 * 0.3333 = 833.25 -> round(8.3325)*100 = 800
    expect(getDailyRateForDuration(2500, 45)).toBe(800)
  })
  it('guards invalid input', () => {
    expect(getDailyRateForDuration(2500, 0)).toBe(2500)
    expect(getDailyRateForDuration(0, 5)).toBe(0)
  })
})

describe('pricing: totals & info', () => {
  it('calculateTotalPrice multiplies daily rate by days', () => {
    expect(calculateTotalPrice(2500, 3)).toBe(6000) // 2000 * 3
  })
  it('getRentalPriceInfo returns rate, total and discount %', () => {
    const info = getRentalPriceInfo(2500, 3)
    expect(info.dailyRate).toBe(2000)
    expect(info.totalPrice).toBe(6000)
    expect(info.discountPercent).toBe(20)
  })
  it('no discount for a single day', () => {
    expect(getRentalPriceInfo(2500, 1).discountPercent).toBe(0)
  })
})

describe('pricing: calculateDays', () => {
  it('counts inclusive day span', () => {
    expect(calculateDays('2026-01-01', '2026-01-04')).toBe(3)
  })
  it('never returns less than 1', () => {
    expect(calculateDays('2026-01-01', '2026-01-01')).toBe(1)
  })
  it('accepts Date objects', () => {
    expect(calculateDays(new Date('2026-03-01'), new Date('2026-03-08'))).toBe(7)
  })
})
