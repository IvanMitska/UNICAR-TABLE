import { describe, it, expect } from 'vitest'
import { computeAlerts } from './useAlerts'
import type { Vehicle, Rental, Client, Maintenance } from '@/types'

// ISO date N days from today (local midnight)
const day = (n: number) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d.toISOString() }

const vehicle = (o: Partial<Vehicle>): Vehicle => ({
  id: 1, brand: 'BMW', model: '420i', licensePlate: 'A1', vin: '', year: 2022, color: 'black',
  fuelType: 'petrol', mileage: 0, status: 'available', rateDaily: 0, rate3days: 0, rate7days: 0, rateMonthly: 0,
  insuranceExpiry: null, inspectionExpiry: null, photoUrl: null, notes: null, createdAt: '', updatedAt: '', ...o,
} as Vehicle)

const rental = (o: Partial<Rental>): Rental => ({
  id: 1, vehicleId: 1, clientId: 1, startDate: day(-10), plannedEndDate: day(2), actualEndDate: null,
  mileageStart: 0, mileageEnd: null, fuelLevelStart: 100, fuelLevelEnd: null, rateType: 'daily', rateAmount: 1000,
  deposit: 0, depositReturned: false, paymentMethod: 'cash', paymentStatus: 'paid', totalAmount: 1000,
  extras: null, conditionStart: null, conditionEnd: null, notes: null, status: 'active', createdAt: '',
  createdBy: null, createdByName: null, vehicle: { brand: 'BMW', model: '420i' } as Vehicle, client: { fullName: 'Иван' } as Client, ...o,
} as Rental)

const client = (o: Partial<Client>): Client => ({
  id: 1, fullName: 'Иван', phone: '+66', status: 'active', licenseExpiry: day(400), ...o,
} as unknown as Client)

describe('computeAlerts', () => {
  it('returns nothing when everything is healthy', () => {
    const alerts = computeAlerts(
      [vehicle({ insuranceExpiry: day(200), inspectionExpiry: day(200) })],
      [rental({ status: 'active', plannedEndDate: day(30), paymentStatus: 'paid' })],
      [client({ licenseExpiry: day(400) })],
      [],
    )
    expect(alerts).toHaveLength(0)
  })

  it('flags an overdue rental as danger in the rentals group', () => {
    const alerts = computeAlerts([vehicle({})], [rental({ status: 'overdue', plannedEndDate: day(-3), paymentStatus: 'paid' })], [], [])
    const a = alerts.find(x => x.group === 'rentals')
    expect(a).toBeTruthy()
    expect(a!.severity).toBe('danger')
  })

  it('flags an unpaid rental in the payments group with the amount', () => {
    const alerts = computeAlerts([vehicle({})], [rental({ paymentStatus: 'unpaid', totalAmount: 9800 })], [], [])
    const a = alerts.find(x => x.group === 'payments')
    expect(a).toBeTruthy()
    expect(a!.amount).toBe(9800)
  })

  it('ignores completed/cancelled rentals', () => {
    const alerts = computeAlerts(
      [vehicle({})],
      [rental({ status: 'completed', plannedEndDate: day(-3), paymentStatus: 'unpaid' }), rental({ id: 2, status: 'cancelled', paymentStatus: 'unpaid' })],
      [], [],
    )
    expect(alerts.filter(a => a.group === 'rentals' || a.group === 'payments')).toHaveLength(0)
  })

  it('flags expiring vehicle documents and client licenses', () => {
    const alerts = computeAlerts(
      [vehicle({ insuranceExpiry: day(-5), inspectionExpiry: day(10) })],
      [], [client({ licenseExpiry: day(-1) })], [],
    )
    const docs = alerts.filter(a => a.group === 'documents')
    // insurance expired (danger) + inspection soon (warning) + license expired (danger)
    expect(docs.length).toBe(3)
    expect(docs.some(d => d.severity === 'danger')).toBe(true)
  })

  it('flags maintenance due from the latest record', () => {
    const alerts = computeAlerts(
      [vehicle({})], [],
      [],
      [{ id: 1, vehicleId: 1, type: 'scheduled', date: day(-30), mileage: 0, cost: 0, location: '', description: '', nextMaintenanceMileage: null, nextMaintenanceDate: day(5), createdAt: '' } as Maintenance],
    )
    expect(alerts.some(a => a.group === 'maintenance')).toBe(true)
  })

  it('sorts the most urgent (danger) first', () => {
    const alerts = computeAlerts(
      [vehicle({ insuranceExpiry: day(10) })], // warning
      [rental({ status: 'overdue', plannedEndDate: day(-2), paymentStatus: 'paid' })], // danger
      [], [],
    )
    expect(alerts.length).toBeGreaterThan(1)
    expect(alerts[0].severity).toBe('danger')
  })
})
