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

async function resetVehicles() {
  const client = await pool.connect()

  try {
    // Check for active rentals
    const activeRentals = await client.query(`
      SELECT COUNT(*) as count FROM rentals WHERE status IN ('active', 'overdue')
    `)

    if (parseInt(activeRentals.rows[0].count) > 0) {
      console.log(`WARNING: There are ${activeRentals.rows[0].count} active rentals.`)
      console.log('Cannot delete vehicles with active rentals.')
      console.log('Complete or cancel active rentals first.')
      process.exit(1)
    }

    console.log('No active rentals. Starting reset...\n')

    await client.query('BEGIN')

    // Delete all vehicle_metadata
    const metaDeleted = await client.query('DELETE FROM vehicle_metadata RETURNING id')
    console.log(`Deleted ${metaDeleted.rowCount} metadata records`)

    // Delete all maintenance records
    const maintDeleted = await client.query('DELETE FROM maintenance RETURNING id')
    console.log(`Deleted ${maintDeleted.rowCount} maintenance records`)

    // Delete all expenses linked to vehicles
    const expDeleted = await client.query('DELETE FROM expenses WHERE vehicle_id IS NOT NULL RETURNING id')
    console.log(`Deleted ${expDeleted.rowCount} vehicle expense records`)

    // Delete all rentals (should be none active)
    const rentalsDeleted = await client.query('DELETE FROM rentals RETURNING id')
    console.log(`Deleted ${rentalsDeleted.rowCount} rental records`)

    // Delete all booking requests
    const bookingsDeleted = await client.query('DELETE FROM booking_requests RETURNING id')
    console.log(`Deleted ${bookingsDeleted.rowCount} booking request records`)

    // Delete all vehicles
    const vehDeleted = await client.query('DELETE FROM vehicles RETURNING id')
    console.log(`Deleted ${vehDeleted.rowCount} vehicles`)

    // Reset vehicle ID sequence
    await client.query('ALTER SEQUENCE vehicles_id_seq RESTART WITH 1')
    console.log('Reset vehicle ID sequence\n')

    // Insert new vehicles
    console.log('Adding 34 vehicles...\n')

    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i]
      const licensePlate = `UNI-${String(i + 1).padStart(3, '0')}`

      // Insert vehicle
      const vehicleResult = await client.query(`
        INSERT INTO vehicles (brand, model, license_plate, year, color, fuel_type, rate_daily, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'available')
        RETURNING id
      `, [v.brand, v.model, licensePlate, v.year, v.color, v.fuelType, v.rateDaily])

      const vehicleId = vehicleResult.rows[0].id

      // Insert metadata
      await client.query(`
        INSERT INTO vehicle_metadata (vehicle_id, website_id, category, is_visible)
        VALUES ($1, $2, $3, true)
      `, [vehicleId, v.websiteId, v.category])

      console.log(`  ${vehicleId}. ${v.brand} ${v.model} ${v.color} → ${v.websiteId}`)
    }

    await client.query('COMMIT')

    console.log(`\n✓ Done! Added ${vehicles.length} vehicles.`)
    console.log('\nLicense plates are temporary (UNI-001, UNI-002...) — update in CRM.')

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error:', error)
    process.exit(1)
  } finally {
    client.release()
    process.exit(0)
  }
}

resetVehicles()
