-- Settings table (stores PIN and other settings)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  license_plate TEXT UNIQUE NOT NULL,
  vin TEXT,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  fuel_type TEXT NOT NULL DEFAULT 'petrol',
  mileage INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  insurance_expiry DATE,
  inspection_expiry DATE,
  photo_url TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rentals table
CREATE TABLE IF NOT EXISTS rentals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  start_date DATETIME NOT NULL,
  planned_end_date DATETIME NOT NULL,
  actual_end_date DATETIME,
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
  FOREIGN KEY (client_id) REFERENCES clients (id)
);

-- Maintenance table
CREATE TABLE IF NOT EXISTS maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  mileage INTEGER NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  next_maintenance_mileage INTEGER,
  next_maintenance_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles (status);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles (license_plate);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients (phone);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals (status);
CREATE INDEX IF NOT EXISTS idx_rentals_vehicle_id ON rentals (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rentals_client_id ON rentals (client_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON expenses (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);
