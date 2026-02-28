import { pool } from './database.js'

async function cleanupDuplicates() {
  const client = await pool.connect()

  try {
    console.log('Finding vehicles without websiteId (duplicates)...\n')

    // Find all vehicles without websiteId
    const unlinkedResult = await client.query(`
      SELECT v.id, v.brand, v.model, v.year, v.color, v.license_plate
      FROM vehicles v
      LEFT JOIN vehicle_metadata m ON v.id = m.vehicle_id
      WHERE v.status != 'archived' AND m.id IS NULL
      ORDER BY v.id
    `)

    if (unlinkedResult.rows.length === 0) {
      console.log('No duplicates found. All vehicles have websiteId.')
      process.exit(0)
    }

    console.log(`Found ${unlinkedResult.rows.length} vehicles without websiteId\n`)

    let deleted = 0
    let kept = 0
    const keptVehicles: Array<{ id: number; reason: string; details: string }> = []

    for (const v of unlinkedResult.rows) {
      // Check for active rentals
      const activeRentals = await client.query(`
        SELECT id FROM rentals
        WHERE vehicle_id = $1 AND status IN ('active', 'overdue')
      `, [v.id])

      if (activeRentals.rows.length > 0) {
        keptVehicles.push({
          id: v.id,
          reason: 'active rental',
          details: `#${v.id} ${v.brand} ${v.model} (${v.license_plate})`
        })
        kept++
        continue
      }

      // Check for pending booking requests
      const pendingBookings = await client.query(`
        SELECT id FROM booking_requests
        WHERE vehicle_id = $1 AND status IN ('pending', 'confirmed')
      `, [v.id])

      if (pendingBookings.rows.length > 0) {
        keptVehicles.push({
          id: v.id,
          reason: 'pending booking',
          details: `#${v.id} ${v.brand} ${v.model} (${v.license_plate})`
        })
        kept++
        continue
      }

      // Safe to delete - first delete related records
      await client.query('BEGIN')

      try {
        // Delete completed rentals for this vehicle
        await client.query('DELETE FROM rentals WHERE vehicle_id = $1', [v.id])

        // Delete maintenance records
        await client.query('DELETE FROM maintenance WHERE vehicle_id = $1', [v.id])

        // Delete expenses
        await client.query('DELETE FROM expenses WHERE vehicle_id = $1', [v.id])

        // Delete booking requests (completed/rejected only since we checked pending above)
        await client.query('DELETE FROM booking_requests WHERE vehicle_id = $1', [v.id])

        // Delete the vehicle
        await client.query('DELETE FROM vehicles WHERE id = $1', [v.id])

        await client.query('COMMIT')

        console.log(`  🗑️  Deleted #${v.id} ${v.brand} ${v.model} ${v.color} (${v.license_plate})`)
        deleted++
      } catch (err) {
        await client.query('ROLLBACK')
        console.log(`  ❌ Failed to delete #${v.id}: ${err}`)
        kept++
      }
    }

    console.log(`\n✓ Cleanup complete!`)
    console.log(`  Deleted: ${deleted}`)
    console.log(`  Kept: ${kept}`)

    if (keptVehicles.length > 0) {
      console.log(`\n⚠️  Vehicles kept (have active rentals/bookings):`)
      keptVehicles.forEach(v => {
        console.log(`    ${v.details} — ${v.reason}`)
      })
      console.log(`\nThese vehicles need to be handled manually after completing their rentals.`)
    }

    // Show final count
    const finalCount = await client.query(`
      SELECT COUNT(*) as count FROM vehicles WHERE status != 'archived'
    `)
    console.log(`\nTotal vehicles now: ${finalCount.rows[0].count}`)

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    client.release()
    process.exit(0)
  }
}

cleanupDuplicates()
