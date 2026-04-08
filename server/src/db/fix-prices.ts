/**
 * Fix vehicle daily rates and recalculate all rentals
 */
import { pool } from './database.js'
import { getRentalPriceInfo } from '../utils/pricing.js'

// Base daily prices from website
const PRICE_MAP: Record<string, number> = {
  // PREMIUM / SPORT - 15,000
  'Ford Mustang': 15000,
  'BMW 430i': 15000,
  'Mercedes C300': 15000,
  'Mercedes S-Class': 15000,
  'Mercedes S500e': 15000,
  'Mercedes Vito': 15000,

  // BMW 420i - 12,000
  'BMW 420i': 12000,

  // SUV - 10,000
  'BMW X5': 10000,

  // SUV - 8,000
  'Ford Raptor': 8000,

  // PREMIUM SUV / ECONOMY - 7,000
  'Ford Everest': 7000,
  'Toyota Fortuner': 7000,
  'Mercedes C350e': 7000,
  'Mercedes E350': 7000,
  'Mercedes E-Class': 7000,

  // LONG-TERM - 1,500
  'Toyota C-HR': 1500,

  // ECONOMY - 500
  'MG ZS': 500,
  'Nissan Juke': 500,
  'Honda Jazz': 500,
  'Mazda 2': 500,
  'Mitsubishi Mirage': 500,
}

function getBasePrice(brand: string, model: string): number {
  // Try exact match first
  const key = `${brand} ${model}`
  if (PRICE_MAP[key]) return PRICE_MAP[key]

  // Try brand + partial model
  for (const [name, price] of Object.entries(PRICE_MAP)) {
    if (key.includes(name) || name.includes(key)) return price
  }

  // Try just brand
  for (const [name, price] of Object.entries(PRICE_MAP)) {
    if (name.startsWith(brand)) return price
  }

  // Default for unknown
  return 5000
}

async function fixPrices() {
  const client = await pool.connect()

  try {
    console.log('=== Step 1: Update vehicle daily rates ===\n')

    const vehicles = await client.query('SELECT id, brand, model, rate_daily FROM vehicles')

    for (const v of vehicles.rows) {
      const basePrice = getBasePrice(v.brand, v.model)
      const currentPrice = parseFloat(v.rate_daily) || 0

      if (currentPrice !== basePrice) {
        await client.query(
          'UPDATE vehicles SET rate_daily = $1 WHERE id = $2',
          [basePrice, v.id]
        )
        console.log(`${v.brand} ${v.model}: ${currentPrice} → ${basePrice}`)
      }
    }

    console.log('\n=== Step 2: Recalculate rentals with correct base prices ===\n')

    const rentals = await client.query(`
      SELECT r.id, r.start_date, r.planned_end_date, r.rate_amount, r.total_amount, r.vehicle_id,
             v.brand, v.model
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id
    `)

    let updated = 0
    for (const r of rentals.rows) {
      const basePrice = getBasePrice(r.brand, r.model)
      const start = new Date(r.start_date)
      const end = new Date(r.planned_end_date)
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

      const priceInfo = getRentalPriceInfo(basePrice, days)
      const oldTotal = parseFloat(r.total_amount)

      // Update rate_amount to base price and total_amount to calculated
      await client.query(
        'UPDATE rentals SET rate_amount = $1, total_amount = $2 WHERE id = $3',
        [basePrice, priceInfo.totalPrice, r.id]
      )

      console.log(`#${r.id} ${r.brand} ${r.model}: ${days} days`)
      console.log(`  Base: ฿${basePrice}/day → Daily: ฿${priceInfo.dailyRate} (-${priceInfo.discountPercent}%)`)
      console.log(`  Total: ฿${oldTotal.toLocaleString()} → ฿${priceInfo.totalPrice.toLocaleString()}`)
      updated++
    }

    console.log(`\n✅ Updated ${updated} rentals`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

fixPrices()
