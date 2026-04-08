import { pool } from './database.js'

async function check() {
  const result = await pool.query('SELECT COUNT(*) as count FROM vehicles WHERE status != \'archived\'')
  console.log('Vehicles in DB:', result.rows[0].count)

  const vehicles = await pool.query('SELECT id, brand, model, license_plate FROM vehicles ORDER BY id DESC LIMIT 10')
  console.log('\nLast 10 vehicles:')
  vehicles.rows.forEach(v => console.log(' ', v.id, v.brand, v.model, '-', v.license_plate))

  process.exit(0)
}

check()
