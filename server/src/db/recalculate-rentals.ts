/**
 * Script to recalculate total_amount for all rentals using the new pricing logic
 */
import { pool } from './database.js'
import { getRentalPriceInfo } from '../utils/pricing.js'

async function recalculateRentals() {
  const client = await pool.connect()

  try {
    // Get all rentals
    const result = await client.query(`
      SELECT id, start_date, planned_end_date, rate_amount, total_amount
      FROM rentals
    `)

    console.log(`Found ${result.rows.length} rentals to recalculate`)

    let updated = 0

    for (const rental of result.rows) {
      const start = new Date(rental.start_date)
      const end = new Date(rental.planned_end_date)
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

      const basePrice = parseFloat(rental.rate_amount)
      const priceInfo = getRentalPriceInfo(basePrice, days)

      const oldTotal = parseFloat(rental.total_amount)
      const newTotal = priceInfo.totalPrice

      if (Math.abs(oldTotal - newTotal) > 1) {
        await client.query(
          'UPDATE rentals SET total_amount = $1 WHERE id = $2',
          [newTotal, rental.id]
        )

        console.log(`Rental #${rental.id}: ${days} days, base ฿${basePrice}`)
        console.log(`  Daily rate: ฿${priceInfo.dailyRate} (-${priceInfo.discountPercent}%)`)
        console.log(`  Old total: ฿${oldTotal.toLocaleString()} → New total: ฿${newTotal.toLocaleString()}`)
        updated++
      }
    }

    console.log(`\n✅ Updated ${updated} rentals`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

recalculateRentals()
