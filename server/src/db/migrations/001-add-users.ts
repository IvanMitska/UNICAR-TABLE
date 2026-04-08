import { pool } from '../database.js'
import bcrypt from 'bcryptjs'

export async function migrateUsers() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'agent',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      )
    `)
    console.log('✓ Created users table')

    // 2. Add user_id to sessions table
    const sessionsCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'sessions' AND column_name = 'user_id'
    `)
    if (sessionsCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE sessions ADD COLUMN user_id INTEGER REFERENCES users(id)
      `)
      console.log('✓ Added user_id to sessions')
    }

    // 3. Add created_by to rentals table
    const rentalsCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'rentals' AND column_name = 'created_by'
    `)
    if (rentalsCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE rentals ADD COLUMN created_by INTEGER REFERENCES users(id)
      `)
      console.log('✓ Added created_by to rentals')
    }

    // 4. Add created_by to expenses table
    const expensesCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'expenses' AND column_name = 'created_by'
    `)
    if (expensesCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE expenses ADD COLUMN created_by INTEGER REFERENCES users(id)
      `)
      console.log('✓ Added created_by to expenses')
    }

    // 5. Add created_by to maintenance table
    const maintenanceCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'maintenance' AND column_name = 'created_by'
    `)
    if (maintenanceCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE maintenance ADD COLUMN created_by INTEGER REFERENCES users(id)
      `)
      console.log('✓ Added created_by to maintenance')
    }

    // 6. Create admin user if not exists
    const adminCheck = await client.query(
      `SELECT id FROM users WHERE username = 'admin'`
    )

    if (adminCheck.rows.length === 0) {
      // Use the same PIN (1124) as initial admin password
      const hashedPassword = bcrypt.hashSync('admin1124', 10)
      await client.query(`
        INSERT INTO users (username, password_hash, full_name, role)
        VALUES ('admin', $1, 'Администратор', 'admin')
      `, [hashedPassword])
      console.log('✓ Created admin user (login: admin, password: admin1124)')
    }

    // 7. Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_rentals_created_by ON rentals(created_by);
      CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
      CREATE INDEX IF NOT EXISTS idx_maintenance_created_by ON maintenance(created_by);
    `)
    console.log('✓ Created indexes')

    await client.query('COMMIT')
    console.log('\n✅ Users migration completed successfully!')

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Migration failed:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run migration if executed directly
const isMainModule = process.argv[1]?.includes('001-add-users')
if (isMainModule) {
  migrateUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
