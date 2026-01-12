import { Router, Request, Response } from 'express'
import { pool } from '../db/database.js'

const router = Router()

interface CountResult {
  count: string
}

interface SumResult {
  total: string | null
}

interface RentalRow {
  id: number
  planned_end_date: string
  vehicle_brand: string
  vehicle_model: string
  client_full_name: string
}

// Get summary stats
router.get('/summary', async (req: Request, res: Response) => {
  const { from, to } = req.query

  // Default to current month
  const startDate = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const endDate = to || new Date().toISOString().split('T')[0]

  try {
    // Active rentals count
    const activeRentalsResult = await pool.query<CountResult>(`
      SELECT COUNT(*) as count FROM rentals WHERE status = 'active'
    `)

    // Available vehicles count
    const availableVehiclesResult = await pool.query<CountResult>(`
      SELECT COUNT(*) as count FROM vehicles WHERE status = 'available'
    `)

    // Total income for period (from completed rentals)
    const incomeResult = await pool.query<SumResult>(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM rentals
      WHERE status = 'completed'
      AND DATE(actual_end_date) BETWEEN $1 AND $2
    `, [startDate, endDate])

    // Total expenses for period
    const expensesResult = await pool.query<SumResult>(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date BETWEEN $1 AND $2
    `, [startDate, endDate])

    // Maintenance costs for period
    const maintenanceCostsResult = await pool.query<SumResult>(`
      SELECT COALESCE(SUM(cost), 0) as total
      FROM maintenance
      WHERE date BETWEEN $1 AND $2
    `, [startDate, endDate])

    // Next return (closest ending rental)
    const nextReturnResult = await pool.query<RentalRow>(`
      SELECT r.id, r.planned_end_date,
        v.brand as vehicle_brand, v.model as vehicle_model,
        c.full_name as client_full_name
      FROM rentals r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.status = 'active'
      ORDER BY r.planned_end_date ASC
      LIMIT 1
    `)

    let nextReturnData = null
    if (nextReturnResult.rows.length > 0) {
      const nextReturn = nextReturnResult.rows[0]
      const hoursRemaining = Math.max(0, Math.ceil(
        (new Date(nextReturn.planned_end_date).getTime() - Date.now()) / (1000 * 60 * 60)
      ))
      nextReturnData = {
        rental: {
          id: nextReturn.id,
          plannedEndDate: nextReturn.planned_end_date,
          vehicle: {
            brand: nextReturn.vehicle_brand,
            model: nextReturn.vehicle_model,
          },
          client: {
            fullName: nextReturn.client_full_name,
          },
        },
        hoursRemaining,
      }
    }

    const income = parseFloat(incomeResult.rows[0].total || '0')
    const expenses = parseFloat(expensesResult.rows[0].total || '0')
    const maintenanceCosts = parseFloat(maintenanceCostsResult.rows[0].total || '0')

    res.json({
      activeRentals: parseInt(activeRentalsResult.rows[0].count),
      availableVehicles: parseInt(availableVehiclesResult.rows[0].count),
      monthlyIncome: income,
      totalIncome: income,
      totalExpenses: expenses + maintenanceCosts,
      profit: income - expenses - maintenanceCosts,
      nextReturn: nextReturnData,
    })
  } catch (error) {
    console.error('Get summary error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get income report
router.get('/income', async (req: Request, res: Response) => {
  const { from, to } = req.query

  if (!from || !to) {
    return res.status(400).json({ error: 'Date range required' })
  }

  try {
    const rentalsResult = await pool.query(`
      SELECT r.*, v.brand, v.model, c.full_name as client_name
      FROM rentals r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.status = 'completed'
      AND DATE(r.actual_end_date) BETWEEN $1 AND $2
      ORDER BY r.actual_end_date DESC
    `, [from, to])

    const totalResult = await pool.query<SumResult>(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM rentals
      WHERE status = 'completed'
      AND DATE(actual_end_date) BETWEEN $1 AND $2
    `, [from, to])

    res.json({
      rentals: rentalsResult.rows,
      total: parseFloat(totalResult.rows[0].total || '0'),
    })
  } catch (error) {
    console.error('Get income report error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get expenses report
router.get('/expenses', async (req: Request, res: Response) => {
  const { from, to } = req.query

  if (!from || !to) {
    return res.status(400).json({ error: 'Date range required' })
  }

  try {
    // Regular expenses
    const expensesResult = await pool.query(`
      SELECT e.*, v.brand, v.model
      FROM expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      WHERE e.date BETWEEN $1 AND $2
      ORDER BY e.date DESC
    `, [from, to])

    // Maintenance costs
    const maintenanceResult = await pool.query(`
      SELECT m.*, v.brand, v.model
      FROM maintenance m
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.date BETWEEN $1 AND $2
      ORDER BY m.date DESC
    `, [from, to])

    const expensesTotalResult = await pool.query<SumResult>(`
      SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date BETWEEN $1 AND $2
    `, [from, to])

    const maintenanceTotalResult = await pool.query<SumResult>(`
      SELECT COALESCE(SUM(cost), 0) as total FROM maintenance WHERE date BETWEEN $1 AND $2
    `, [from, to])

    const expensesTotal = parseFloat(expensesTotalResult.rows[0].total || '0')
    const maintenanceTotal = parseFloat(maintenanceTotalResult.rows[0].total || '0')

    res.json({
      expenses: expensesResult.rows,
      maintenance: maintenanceResult.rows,
      expensesTotal,
      maintenanceTotal,
      total: expensesTotal + maintenanceTotal,
    })
  } catch (error) {
    console.error('Get expenses report error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get vehicle utilization
router.get('/utilization', async (req: Request, res: Response) => {
  const { from, to } = req.query

  if (!from || !to) {
    return res.status(400).json({ error: 'Date range required' })
  }

  try {
    const vehiclesResult = await pool.query(`
      SELECT v.id, v.brand, v.model, v.license_plate,
        COALESCE(SUM(
          GREATEST(0,
            EXTRACT(DAY FROM (
              LEAST(COALESCE(r.actual_end_date, r.planned_end_date), $1::DATE) -
              GREATEST(r.start_date::DATE, $2::DATE)
            )) + 1
          )
        ), 0)::INTEGER as rental_days
      FROM vehicles v
      LEFT JOIN rentals r ON v.id = r.vehicle_id AND r.status IN ('active', 'completed')
        AND r.start_date::DATE <= $1::DATE AND COALESCE(r.actual_end_date, r.planned_end_date)::DATE >= $2::DATE
      WHERE v.status != 'archived'
      GROUP BY v.id
    `, [to, from])

    const totalDays = Math.ceil(
      (new Date(to as string).getTime() - new Date(from as string).getTime()) / (1000 * 60 * 60 * 24)
    )

    const result = vehiclesResult.rows.map((v: Record<string, unknown>) => ({
      id: v.id,
      brand: v.brand,
      model: v.model,
      licensePlate: v.license_plate,
      rentalDays: parseInt(v.rental_days as string) || 0,
      totalDays,
      utilization: totalDays > 0 ? Math.round(((parseInt(v.rental_days as string) || 0) / totalDays) * 100) : 0,
    }))

    res.json(result)
  } catch (error) {
    console.error('Get utilization error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
