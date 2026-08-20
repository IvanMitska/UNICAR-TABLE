import { describe, it, expect } from 'vitest'
import { toCamelCase, toSnakeCase } from './database.js'

describe('toCamelCase', () => {
  it('converts simple snake_case keys', () => {
    expect(toCamelCase({ full_name: 'a', phone_alt: 'b' })).toEqual({
      fullName: 'a',
      phoneAlt: 'b',
    })
  })

  it('leaves already-camelCase / single-word keys untouched', () => {
    expect(toCamelCase({ id: 1, status: 'active' })).toEqual({ id: 1, status: 'active' })
  })

  it('converts multi-underscore keys', () => {
    expect(toCamelCase({ customer_birth_date: 'x' })).toEqual({ customerBirthDate: 'x' })
  })

  it('converts keys that contain digits after an underscore', () => {
    // BUG PROBE: DB columns rate_3days / rate_7days must map to the client
    // field names rate3days / rate7days. The regex /_([a-z])/g ignores _3 / _7.
    const result = toCamelCase<Record<string, unknown>>({ rate_3days: 100, rate_7days: 200 })
    expect(result).toHaveProperty('rate3days', 100)
    expect(result).toHaveProperty('rate7days', 200)
  })
})

describe('toSnakeCase', () => {
  it('converts simple camelCase keys', () => {
    expect(toSnakeCase({ fullName: 'a', phoneAlt: 'b' })).toEqual({
      full_name: 'a',
      phone_alt: 'b',
    })
  })

  it('round-trips with toCamelCase for rate fields', () => {
    // BUG PROBE: rate3days -> rate_3days -> rate3days should be stable.
    const original = { rate3days: 100, rate7days: 200, rateDaily: 50 }
    const snake = toSnakeCase(original)
    const back = toCamelCase<Record<string, unknown>>(snake)
    expect(back).toEqual(original)
  })
})
