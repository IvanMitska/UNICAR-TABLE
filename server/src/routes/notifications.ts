import { Router, Request, Response } from 'express'
import { pool } from '../db/database.js'

const router = Router()

interface Notification {
  id: string
  type: string
  title: string
  message: string
  relatedId: number | null
  relatedType: string | null
  isRead: boolean
  createdAt: string
}

// Get all notifications (generated dynamically)
router.get('/', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20
  const notifications: Notification[] = []
  const now = new Date()

  try {
    // Check rentals ending soon (within 24 hours)
    const endingRentalsResult = await pool.query<{
      id: number
      planned_end_date: string
      brand: string
      model: string
      full_name: string
    }>(`
      SELECT r.id, r.planned_end_date, v.brand, v.model, c.full_name
      FROM rentals r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.status = 'active'
      AND r.planned_end_date <= NOW() + INTERVAL '1 day'
      ORDER BY r.planned_end_date ASC
    `)

    endingRentalsResult.rows.forEach((r) => {
      const endDate = new Date(r.planned_end_date)
      const hoursLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60))

      notifications.push({
        id: `rental-ending-${r.id}`,
        type: 'rental_ending',
        title: 'Скоро возврат',
        message: `${r.brand} ${r.model} - ${r.full_name} вернёт через ${hoursLeft} ч`,
        relatedId: r.id,
        relatedType: 'rental',
        isRead: false,
        createdAt: now.toISOString(),
      })
    })

    // Check insurance expiring (within 30 days)
    const expiringInsuranceResult = await pool.query<{
      id: number
      brand: string
      model: string
      license_plate: string
      insurance_expiry: string
    }>(`
      SELECT id, brand, model, license_plate, insurance_expiry
      FROM vehicles
      WHERE status != 'archived'
      AND insurance_expiry IS NOT NULL
      AND insurance_expiry <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY insurance_expiry ASC
    `)

    expiringInsuranceResult.rows.forEach((v) => {
      const expiry = new Date(v.insurance_expiry)
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      notifications.push({
        id: `insurance-${v.id}`,
        type: 'insurance_expiry',
        title: 'Истекает страховка',
        message: `${v.brand} ${v.model} (${v.license_plate}) - осталось ${daysLeft} дн`,
        relatedId: v.id,
        relatedType: 'vehicle',
        isRead: false,
        createdAt: now.toISOString(),
      })
    })

    // Check inspection expiring (within 30 days)
    const expiringInspectionResult = await pool.query<{
      id: number
      brand: string
      model: string
      license_plate: string
      inspection_expiry: string
    }>(`
      SELECT id, brand, model, license_plate, inspection_expiry
      FROM vehicles
      WHERE status != 'archived'
      AND inspection_expiry IS NOT NULL
      AND inspection_expiry <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY inspection_expiry ASC
    `)

    expiringInspectionResult.rows.forEach((v) => {
      const expiry = new Date(v.inspection_expiry)
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      notifications.push({
        id: `inspection-${v.id}`,
        type: 'inspection_expiry',
        title: 'Истекает ТО',
        message: `${v.brand} ${v.model} (${v.license_plate}) - осталось ${daysLeft} дн`,
        relatedId: v.id,
        relatedType: 'vehicle',
        isRead: false,
        createdAt: now.toISOString(),
      })
    })

    // Check client license expiring (within 30 days) for active rentals
    const expiringLicensesResult = await pool.query<{
      id: number
      full_name: string
      license_expiry: string
    }>(`
      SELECT DISTINCT c.id, c.full_name, c.license_expiry
      FROM clients c
      INNER JOIN rentals r ON c.id = r.client_id AND r.status = 'active'
      WHERE c.license_expiry <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY c.license_expiry ASC
    `)

    expiringLicensesResult.rows.forEach((c) => {
      const expiry = new Date(c.license_expiry)
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      notifications.push({
        id: `license-${c.id}`,
        type: 'license_expiry',
        title: 'Истекает права клиента',
        message: `${c.full_name} - права истекают через ${daysLeft} дн`,
        relatedId: c.id,
        relatedType: 'client',
        isRead: false,
        createdAt: now.toISOString(),
      })
    })

    // Check upcoming maintenance
    const upcomingMaintenanceResult = await pool.query<{
      id: number
      brand: string
      model: string
      mileage: number
      next_maintenance_mileage: number | null
      next_maintenance_date: string | null
    }>(`
      SELECT v.id, v.brand, v.model, v.mileage, m.next_maintenance_mileage, m.next_maintenance_date
      FROM vehicles v
      INNER JOIN maintenance m ON v.id = m.vehicle_id
      WHERE v.status != 'archived'
      AND (
        (m.next_maintenance_mileage IS NOT NULL AND v.mileage >= m.next_maintenance_mileage - 500)
        OR (m.next_maintenance_date IS NOT NULL AND m.next_maintenance_date <= CURRENT_DATE + INTERVAL '14 days')
      )
      GROUP BY v.id, m.next_maintenance_mileage, m.next_maintenance_date
    `)

    upcomingMaintenanceResult.rows.forEach((v) => {
      let message = `${v.brand} ${v.model} - `
      if (v.next_maintenance_mileage && v.mileage >= v.next_maintenance_mileage - 500) {
        const kmLeft = v.next_maintenance_mileage - v.mileage
        message += `${kmLeft} км до ТО`
      } else if (v.next_maintenance_date) {
        const date = new Date(v.next_maintenance_date)
        const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        message += `ТО через ${daysLeft} дн`
      }

      notifications.push({
        id: `maintenance-${v.id}`,
        type: 'maintenance_due',
        title: 'Требуется ТО',
        message,
        relatedId: v.id,
        relatedType: 'vehicle',
        isRead: false,
        createdAt: now.toISOString(),
      })
    })

    // Sort by priority (rental_ending first, then by date) and limit
    notifications.sort((a, b) => {
      const priority: Record<string, number> = {
        rental_ending: 0,
        license_expiry: 1,
        insurance_expiry: 2,
        inspection_expiry: 3,
        maintenance_due: 4,
      }
      return (priority[a.type] || 5) - (priority[b.type] || 5)
    })

    res.json(notifications.slice(0, limit))
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
