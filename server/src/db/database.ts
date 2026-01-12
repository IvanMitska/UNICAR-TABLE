import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Pool } = pg

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set')
  process.exit(1)
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

const schema = `
-- Settings table (stores PIN and other settings)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  license_plate TEXT UNIQUE NOT NULL,
  vin TEXT,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  fuel_type TEXT NOT NULL DEFAULT 'petrol',
  mileage INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  rate_daily DECIMAL(10, 2) DEFAULT 0,
  rate_3days DECIMAL(10, 2) DEFAULT 0,
  rate_7days DECIMAL(10, 2) DEFAULT 0,
  rate_monthly DECIMAL(10, 2) DEFAULT 0,
  insurance_expiry DATE,
  inspection_expiry DATE,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_alt TEXT,
  email TEXT,
  passport TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  birth_date DATE NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rentals table
CREATE TABLE IF NOT EXISTS rentals (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  start_date TIMESTAMP NOT NULL,
  planned_end_date TIMESTAMP NOT NULL,
  actual_end_date TIMESTAMP,
  mileage_start INTEGER NOT NULL,
  mileage_end INTEGER,
  fuel_level_start INTEGER DEFAULT 100,
  fuel_level_end INTEGER,
  rate_type TEXT NOT NULL DEFAULT 'daily',
  rate_amount DECIMAL(10, 2) NOT NULL,
  deposit DECIMAL(10, 2) DEFAULT 0,
  deposit_returned INTEGER DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  total_amount DECIMAL(10, 2) DEFAULT 0,
  extras TEXT,
  condition_start TEXT,
  condition_end TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance table
CREATE TABLE IF NOT EXISTS maintenance (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  type TEXT NOT NULL,
  date DATE NOT NULL,
  mileage INTEGER NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  next_maintenance_mileage INTEGER,
  next_maintenance_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
`

export async function initDatabase() {
  const client = await pool.connect()
  try {
    await client.query(schema)

    // Set/reset PIN to 1124
    const hashedPin = bcrypt.hashSync('1124', 10)
    await client.query(`
      INSERT INTO settings (key, value) VALUES ('pin', $1)
      ON CONFLICT (key) DO UPDATE SET value = $1
    `, [hashedPin])
    console.log('PIN set to: 1124')

    console.log('Database initialized')
  } finally {
    client.release()
  }
}

// Helper to convert snake_case to camelCase
export function toCamelCase<T>(obj: Record<string, unknown> | object): T {
  const result: Record<string, unknown> = {}
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = (obj as Record<string, unknown>)[key]
  }
  return result as T
}

// Helper to convert camelCase to snake_case
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    result[snakeKey] = obj[key]
  }
  return result
}
