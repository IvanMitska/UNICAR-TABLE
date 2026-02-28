import { pool } from './database.js'

interface VehicleSeed {
  websiteId: string
  brand: string
  model: string
  year: number
  color: string
  fuelType: string
  rateDaily: number
  category: string
}

// Correct 34 vehicles list
const vehicles: VehicleSeed[] = [
  // PREMIUM / SPORT (11)
  { websiteId: 'mustang-yellow-2021', brand: 'Ford', model: 'Mustang', year: 2021, color: 'Yellow', fuelType: 'petrol', rateDaily: 15000, category: 'premium' },
  { websiteId: 'mustang-blue-2020', brand: 'Ford', model: 'Mustang', year: 2020, color: 'Blue', fuelType: 'petrol', rateDaily: 15000, category: 'premium' },
  { websiteId: 'mustang-white-2020', brand: 'Ford', model: 'Mustang', year: 2020, color: 'White', fuelType: 'petrol', rateDaily: 15000, category: 'premium' },
  { websiteId: 'bmw-430i-orange', brand: 'BMW', model: '430i', year: 2020, color: 'Orange', fuelType: 'petrol', rateDaily: 15000, category: 'premium' },
  { websiteId: 'bmw-420i-blue', brand: 'BMW', model: '420i', year: 2020, color: 'Blue', fuelType: 'petrol', rateDaily: 15000, category: 'premium' },
  { websiteId: 'mercedes-c300-chameleon', brand: 'Mercedes', model: 'C300', year: 2019, color: 'Chameleon', fuelType: 'petrol', rateDaily: 15000, category: 'premium' },
  { websiteId: 'mercedes-s500e', brand: 'Mercedes', model: 'S500e', year: 2019, color: 'Black', fuelType: 'hybrid', rateDaily: 15000, category: 'premium' },
  { websiteId: 'mercedes-e-class-2019', brand: 'Mercedes', model: 'E-Class', year: 2019, color: 'Black', fuelType: 'petrol', rateDaily: 15000, category: 'premium' },
  { websiteId: 'mercedes-vito-maybach', brand: 'Mercedes', model: 'Vito Maybach', year: 2020, color: 'Black', fuelType: 'diesel', rateDaily: 15000, category: 'premium' },
  { websiteId: 'bmw-430i-black', brand: 'BMW', model: '430i', year: 2020, color: 'Black', fuelType: 'petrol', rateDaily: 15000, category: 'premium' },
  { websiteId: 'mustang-yellow-2016', brand: 'Ford', model: 'Mustang', year: 2016, color: 'Yellow', fuelType: 'petrol', rateDaily: 15000, category: 'premium' },

  // SUV (11)
  { websiteId: 'raptor-2023', brand: 'Ford', model: 'Raptor', year: 2023, color: 'Black', fuelType: 'petrol', rateDaily: 7000, category: 'suv' },
  { websiteId: 'raptor-2024', brand: 'Ford', model: 'Raptor', year: 2024, color: 'Black', fuelType: 'petrol', rateDaily: 7000, category: 'suv' },
  { websiteId: 'everest-2023', brand: 'Ford', model: 'Everest', year: 2023, color: 'Black', fuelType: 'diesel', rateDaily: 7000, category: 'suv' },
  { websiteId: 'everest-2024', brand: 'Ford', model: 'Everest', year: 2024, color: 'Black', fuelType: 'diesel', rateDaily: 7000, category: 'suv' },
  { websiteId: 'fortuner', brand: 'Toyota', model: 'Fortuner', year: 2020, color: 'White', fuelType: 'diesel', rateDaily: 3000, category: 'suv' },
  { websiteId: 'c-hr-1', brand: 'Toyota', model: 'C-HR', year: 2020, color: 'Black', fuelType: 'hybrid', rateDaily: 1500, category: 'suv' },
  { websiteId: 'c-hr-2', brand: 'Toyota', model: 'C-HR', year: 2020, color: 'Black', fuelType: 'hybrid', rateDaily: 1500, category: 'suv' },
  { websiteId: 'bmw-x5-2020', brand: 'BMW', model: 'X5', year: 2020, color: 'Black', fuelType: 'petrol', rateDaily: 7000, category: 'suv' },
  { websiteId: 'mg-zs-blue', brand: 'MG', model: 'ZS', year: 2020, color: 'Blue', fuelType: 'petrol', rateDaily: 500, category: 'suv' },
  { websiteId: 'mg-zs-black-1', brand: 'MG', model: 'ZS', year: 2020, color: 'Black', fuelType: 'petrol', rateDaily: 500, category: 'suv' },
  { websiteId: 'mg-zs-black-2', brand: 'MG', model: 'ZS', year: 2020, color: 'Black', fuelType: 'petrol', rateDaily: 500, category: 'suv' },

  // ECONOMY (12)
  { websiteId: 'juke-1', brand: 'Nissan', model: 'Juke', year: 2017, color: 'Red', fuelType: 'petrol', rateDaily: 500, category: 'economy' },
  { websiteId: 'juke-2', brand: 'Nissan', model: 'Juke', year: 2017, color: 'White', fuelType: 'petrol', rateDaily: 500, category: 'economy' },
  { websiteId: 'honda-jazz', brand: 'Honda', model: 'Jazz', year: 2016, color: 'Grey', fuelType: 'petrol', rateDaily: 500, category: 'economy' },
  { websiteId: 'mazda-2-1', brand: 'Mazda', model: '2', year: 2016, color: 'Red', fuelType: 'petrol', rateDaily: 500, category: 'economy' },
  { websiteId: 'mirage', brand: 'Mitsubishi', model: 'Mirage', year: 2020, color: 'Silver', fuelType: 'petrol', rateDaily: 500, category: 'economy' },
  { websiteId: 'mercedes-c350e-white-1', brand: 'Mercedes', model: 'C350e', year: 2020, color: 'White', fuelType: 'hybrid', rateDaily: 7000, category: 'economy' },
  { websiteId: 'mercedes-c350e-white-2', brand: 'Mercedes', model: 'C350e', year: 2020, color: 'White', fuelType: 'hybrid', rateDaily: 7000, category: 'economy' },
  { websiteId: 'mercedes-c350e-white-3', brand: 'Mercedes', model: 'C350e', year: 2020, color: 'White', fuelType: 'hybrid', rateDaily: 7000, category: 'economy' },
  { websiteId: 'mercedes-c350e-white-4', brand: 'Mercedes', model: 'C350e', year: 2020, color: 'White', fuelType: 'hybrid', rateDaily: 7000, category: 'economy' },
  { websiteId: 'mercedes-c350e-black', brand: 'Mercedes', model: 'C350e', year: 2020, color: 'Black', fuelType: 'hybrid', rateDaily: 7000, category: 'economy' },
  { websiteId: 'mercedes-e350', brand: 'Mercedes', model: 'E350', year: 2018, color: 'Black', fuelType: 'hybrid', rateDaily: 7000, category: 'economy' },
  { websiteId: 'mercedes-e-class-green', brand: 'Mercedes', model: 'E-Class', year: 2020, color: 'Green', fuelType: 'petrol', rateDaily: 7000, category: 'economy' },
]

async function linkVehicles() {
  const client = await pool.connect()

  try {
    console.log('Starting safe vehicle linking...\n')

    // Get all existing vehicles
    const existingVehicles = await client.query(`
      SELECT v.id, v.brand, v.model, v.year, v.color, v.license_plate,
             m.website_id
      FROM vehicles v
      LEFT JOIN vehicle_metadata m ON v.id = m.vehicle_id
      WHERE v.status != 'archived'
      ORDER BY v.id
    `)

    console.log(`Found ${existingVehicles.rows.length} existing vehicles in CRM\n`)

    let linked = 0
    let added = 0
    let skipped = 0

    // Track which existing vehicles have been matched
    const matchedVehicleIds = new Set<number>()

    for (const v of vehicles) {
      // Check if websiteId already exists
      const existingMeta = await client.query(
        'SELECT vehicle_id FROM vehicle_metadata WHERE website_id = $1',
        [v.websiteId]
      )

      if (existingMeta.rows.length > 0) {
        console.log(`  ⏭ ${v.websiteId} — already linked to vehicle #${existingMeta.rows[0].vehicle_id}`)
        skipped++
        continue
      }

      // Try to find matching vehicle by brand + model + year + color (not already matched)
      const match = existingVehicles.rows.find(ev =>
        !matchedVehicleIds.has(ev.id) &&
        ev.brand.toLowerCase() === v.brand.toLowerCase() &&
        ev.model.toLowerCase() === v.model.toLowerCase() &&
        ev.year === v.year &&
        ev.color.toLowerCase() === v.color.toLowerCase()
      )

      if (match) {
        // Link existing vehicle
        matchedVehicleIds.add(match.id)

        if (match.website_id) {
          // Update existing metadata
          await client.query(
            'UPDATE vehicle_metadata SET website_id = $1, category = $2 WHERE vehicle_id = $3',
            [v.websiteId, v.category, match.id]
          )
        } else {
          // Create new metadata
          await client.query(`
            INSERT INTO vehicle_metadata (vehicle_id, website_id, category, is_visible)
            VALUES ($1, $2, $3, true)
          `, [match.id, v.websiteId, v.category])
        }

        // Update rate if needed
        await client.query(
          'UPDATE vehicles SET rate_daily = $1 WHERE id = $2 AND (rate_daily IS NULL OR rate_daily = 0)',
          [v.rateDaily, match.id]
        )

        console.log(`  🔗 ${v.websiteId} → linked to #${match.id} (${match.license_plate})`)
        linked++
      } else {
        // Add new vehicle
        const licensePlate = `NEW-${String(added + 1).padStart(3, '0')}`

        await client.query('BEGIN')

        const vehicleResult = await client.query(`
          INSERT INTO vehicles (brand, model, license_plate, year, color, fuel_type, rate_daily, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'available')
          RETURNING id
        `, [v.brand, v.model, licensePlate, v.year, v.color, v.fuelType, v.rateDaily])

        const vehicleId = vehicleResult.rows[0].id

        await client.query(`
          INSERT INTO vehicle_metadata (vehicle_id, website_id, category, is_visible)
          VALUES ($1, $2, $3, true)
        `, [vehicleId, v.websiteId, v.category])

        await client.query('COMMIT')

        console.log(`  ➕ ${v.websiteId} → added as #${vehicleId} (${licensePlate})`)
        added++
      }
    }

    console.log(`\n✓ Done!`)
    console.log(`  Linked: ${linked}`)
    console.log(`  Added: ${added}`)
    console.log(`  Skipped (already linked): ${skipped}`)

    if (added > 0) {
      console.log(`\n⚠️  New vehicles have temporary plates (NEW-001, NEW-002...) — update them in CRM`)
    }

    // Show unlinked vehicles
    const unlinkedResult = await client.query(`
      SELECT v.id, v.brand, v.model, v.year, v.color, v.license_plate
      FROM vehicles v
      LEFT JOIN vehicle_metadata m ON v.id = m.vehicle_id
      WHERE v.status != 'archived' AND m.id IS NULL
      ORDER BY v.id
    `)

    if (unlinkedResult.rows.length > 0) {
      console.log(`\n⚠️  ${unlinkedResult.rows.length} vehicles without websiteId (not on website):`)
      unlinkedResult.rows.forEach(v => {
        console.log(`    #${v.id} ${v.brand} ${v.model} ${v.year} ${v.color} (${v.license_plate})`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    client.release()
    process.exit(0)
  }
}

linkVehicles()
