import { pool } from './database.js'

interface VehicleSeed {
  websiteId: string
  brand: string
  model: string
  year: number
  color: string
  fuelType: string
}

const vehicles: VehicleSeed[] = [
  // Ford Mustang
  { websiteId: 'mustang-yellow-2021', brand: 'Ford', model: 'Mustang', year: 2021, color: 'Yellow', fuelType: 'petrol' },
  { websiteId: 'mustang-yellow-2016', brand: 'Ford', model: 'Mustang', year: 2016, color: 'Yellow', fuelType: 'petrol' },

  // BMW 4 Series
  { websiteId: 'bmw-430i-black', brand: 'BMW', model: '430i', year: 2020, color: 'Black', fuelType: 'petrol' },
  { websiteId: 'bmw-430i-orange', brand: 'BMW', model: '430i', year: 2020, color: 'Orange', fuelType: 'petrol' },
  { websiteId: 'bmw-420i-blue', brand: 'BMW', model: '420i', year: 2020, color: 'Blue', fuelType: 'petrol' },

  // BMW X5
  { websiteId: 'bmw-x5-2020', brand: 'BMW', model: 'X5', year: 2020, color: 'Black', fuelType: 'petrol' },

  // Mercedes C-Class
  { websiteId: 'mercedes-c300-chameleon', brand: 'Mercedes', model: 'C300', year: 2020, color: 'Chameleon', fuelType: 'petrol' },
  { websiteId: 'mercedes-c350e-white-1', brand: 'Mercedes', model: 'C350e', year: 2018, color: 'White', fuelType: 'hybrid' },
  { websiteId: 'mercedes-c350e-white-2', brand: 'Mercedes', model: 'C350e', year: 2018, color: 'White', fuelType: 'hybrid' },
  { websiteId: 'mercedes-c350e-white-3', brand: 'Mercedes', model: 'C350e', year: 2018, color: 'White', fuelType: 'hybrid' },
  { websiteId: 'mercedes-c350e-white-4', brand: 'Mercedes', model: 'C350e', year: 2018, color: 'White', fuelType: 'hybrid' },
  { websiteId: 'mercedes-c350e-black', brand: 'Mercedes', model: 'C350e', year: 2018, color: 'Black', fuelType: 'hybrid' },

  // Mercedes E-Class
  { websiteId: 'mercedes-e-class-2019', brand: 'Mercedes', model: 'E-Class', year: 2019, color: 'Black', fuelType: 'petrol' },
  { websiteId: 'mercedes-e350', brand: 'Mercedes', model: 'E350', year: 2018, color: 'Black', fuelType: 'hybrid' },
  { websiteId: 'mercedes-e-class-green', brand: 'Mercedes', model: 'E-Class', year: 2019, color: 'Green', fuelType: 'petrol' },

  // Mercedes S-Class & Vito
  { websiteId: 'mercedes-s500e', brand: 'Mercedes', model: 'S500e', year: 2020, color: 'Black', fuelType: 'hybrid' },
  { websiteId: 'mercedes-vito-maybach', brand: 'Mercedes', model: 'Vito Maybach', year: 2020, color: 'Black', fuelType: 'diesel' },

  // Ford Raptor
  { websiteId: 'raptor-2023', brand: 'Ford', model: 'Raptor', year: 2023, color: 'White', fuelType: 'petrol' },
  { websiteId: 'raptor-2024', brand: 'Ford', model: 'Raptor', year: 2024, color: 'White', fuelType: 'petrol' },

  // Ford Everest
  { websiteId: 'everest-2023', brand: 'Ford', model: 'Everest', year: 2023, color: 'White', fuelType: 'diesel' },
  { websiteId: 'everest-2024', brand: 'Ford', model: 'Everest', year: 2024, color: 'White', fuelType: 'diesel' },

  // Toyota
  { websiteId: 'fortuner', brand: 'Toyota', model: 'Fortuner', year: 2020, color: 'White', fuelType: 'diesel' },
  { websiteId: 'c-hr-1', brand: 'Toyota', model: 'C-HR', year: 2020, color: 'White', fuelType: 'hybrid' },
  { websiteId: 'c-hr-2', brand: 'Toyota', model: 'C-HR', year: 2020, color: 'Black', fuelType: 'hybrid' },

  // MG ZS
  { websiteId: 'mg-zs-blue', brand: 'MG', model: 'ZS', year: 2022, color: 'Blue', fuelType: 'petrol' },
  { websiteId: 'mg-zs-black-1', brand: 'MG', model: 'ZS', year: 2022, color: 'Black', fuelType: 'petrol' },
  { websiteId: 'mg-zs-black-2', brand: 'MG', model: 'ZS', year: 2022, color: 'Black', fuelType: 'petrol' },

  // Nissan Juke
  { websiteId: 'juke-1', brand: 'Nissan', model: 'Juke', year: 2020, color: 'White', fuelType: 'petrol' },
  { websiteId: 'juke-2', brand: 'Nissan', model: 'Juke', year: 2020, color: 'Red', fuelType: 'petrol' },

  // Economy
  { websiteId: 'honda-jazz', brand: 'Honda', model: 'Jazz', year: 2019, color: 'White', fuelType: 'petrol' },
  { websiteId: 'mazda-2-1', brand: 'Mazda', model: '2', year: 2019, color: 'Red', fuelType: 'petrol' },
  { websiteId: 'mirage', brand: 'Mitsubishi', model: 'Mirage', year: 2020, color: 'Silver', fuelType: 'petrol' },
]

export async function seedVehicles() {
  const client = await pool.connect()

  try {
    console.log('Starting vehicle seed...')

    let added = 0
    let skipped = 0

    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i]

      // Check if vehicle with this websiteId already exists
      const existing = await client.query(
        'SELECT v.id FROM vehicles v JOIN vehicle_metadata m ON v.id = m.vehicle_id WHERE m.website_id = $1',
        [v.websiteId]
      )

      if (existing.rows.length > 0) {
        console.log(`  Skipped: ${v.websiteId} (already exists)`)
        skipped++
        continue
      }

      // Generate temporary license plate
      const licensePlate = `TBD-${String(i + 1).padStart(3, '0')}`

      // Check if license plate exists
      const plateExists = await client.query(
        'SELECT id FROM vehicles WHERE license_plate = $1',
        [licensePlate]
      )

      if (plateExists.rows.length > 0) {
        console.log(`  Skipped: ${v.websiteId} (license plate conflict)`)
        skipped++
        continue
      }

      await client.query('BEGIN')

      try {
        // Insert vehicle
        const vehicleResult = await client.query(`
          INSERT INTO vehicles (brand, model, license_plate, year, color, fuel_type, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'available')
          RETURNING id
        `, [v.brand, v.model, licensePlate, v.year, v.color, v.fuelType])

        const vehicleId = vehicleResult.rows[0].id

        // Insert metadata with website_id
        await client.query(`
          INSERT INTO vehicle_metadata (vehicle_id, website_id, category, is_visible)
          VALUES ($1, $2, 'economy', true)
        `, [vehicleId, v.websiteId])

        await client.query('COMMIT')

        console.log(`  Added: ${v.websiteId} → ${v.brand} ${v.model} (${licensePlate})`)
        added++
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`  Error adding ${v.websiteId}:`, err)
      }
    }

    console.log(`\nSeed complete: ${added} added, ${skipped} skipped`)
    console.log('\nIMPORTANT: Update license plates (TBD-XXX) with real values in CRM!')

    return { added, skipped }
  } finally {
    client.release()
  }
}

// Run if called directly
const isMainModule = process.argv[1]?.includes('seed-vehicles')
if (isMainModule) {
  seedVehicles()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
