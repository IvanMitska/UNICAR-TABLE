// Vehicle types
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'archived'
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid'

export interface Vehicle {
  id: number
  brand: string
  model: string
  licensePlate: string
  vin: string
  year: number
  color: string
  fuelType: FuelType
  mileage: number
  status: VehicleStatus
  rateDaily: number
  rate3days: number
  rate7days: number
  rateMonthly: number
  insuranceExpiry: string | null
  inspectionExpiry: string | null
  photoUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface VehicleFormData {
  brand: string
  model: string
  licensePlate: string
  vin: string
  year: number
  color: string
  fuelType: FuelType
  mileage: number
  status: VehicleStatus
  rateDaily?: number
  rate3days?: number
  rate7days?: number
  rateMonthly?: number
  insuranceExpiry?: string
  inspectionExpiry?: string
  photoUrl?: string
  notes?: string
}

// Client types
export type ClientStatus = 'active' | 'blacklisted'

export interface Client {
  id: number
  fullName: string
  phone: string
  phoneAlt: string | null
  email: string | null
  passport: string
  licenseNumber: string
  licenseExpiry: string
  birthDate: string
  address: string
  status: ClientStatus
  notes: string | null
  createdAt: string
}

export interface ClientFormData {
  fullName: string
  phone: string
  phoneAlt?: string
  email?: string
  passport: string
  licenseNumber: string
  licenseExpiry: string
  birthDate: string
  address: string
  status: ClientStatus
  notes?: string
}

// Rental types
export type RentalStatus = 'active' | 'completed' | 'cancelled'
export type RateType = 'hourly' | 'daily' | 'monthly'
export type PaymentMethod = 'cash' | 'card' | 'transfer'
export type PaymentStatus = 'paid' | 'partial' | 'unpaid'

export interface Rental {
  id: number
  vehicleId: number
  clientId: number
  startDate: string
  plannedEndDate: string
  actualEndDate: string | null
  mileageStart: number
  mileageEnd: number | null
  fuelLevelStart: number
  fuelLevelEnd: number | null
  rateType: RateType
  rateAmount: number
  deposit: number
  depositReturned: boolean
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  totalAmount: number
  extras: string | null
  conditionStart: string | null
  conditionEnd: string | null
  notes: string | null
  status: RentalStatus
  createdAt: string
  // Joined fields
  vehicle?: Vehicle
  client?: Client
}

export interface RentalFormData {
  vehicleId: number
  clientId: number
  startDate: string
  plannedEndDate: string
  mileageStart: number
  fuelLevelStart: number
  rateType: RateType
  rateAmount: number
  deposit: number
  paymentMethod: PaymentMethod
  extras?: string
  conditionStart?: string
  notes?: string
}

// Maintenance types
export type MaintenanceType = 'scheduled' | 'repair' | 'tire' | 'wash' | 'other'

export interface Maintenance {
  id: number
  vehicleId: number
  type: MaintenanceType
  date: string
  mileage: number
  cost: number
  location: string
  description: string
  nextMaintenanceMileage: number | null
  nextMaintenanceDate: string | null
  createdAt: string
  vehicle?: Vehicle
}

export interface MaintenanceFormData {
  vehicleId: number
  type: MaintenanceType
  date: string
  mileage: number
  cost: number
  location: string
  description: string
  nextMaintenanceMileage?: number
  nextMaintenanceDate?: string
}

// Expense types
export type ExpenseCategory = 'maintenance' | 'insurance' | 'fuel' | 'fine' | 'other'

export interface Expense {
  id: number
  vehicleId: number | null
  category: ExpenseCategory
  amount: number
  date: string
  description: string
  createdAt: string
  vehicle?: Vehicle
}

export interface ExpenseFormData {
  vehicleId?: number
  category: ExpenseCategory
  amount: number
  date: string
  description: string
}

// Notification types
export type NotificationType = 'rental_ending' | 'insurance_expiry' | 'inspection_expiry' | 'maintenance_due' | 'license_expiry' | 'payment_overdue'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  message: string
  relatedId: number | null
  relatedType: 'vehicle' | 'client' | 'rental' | null
  isRead: boolean
  createdAt: string
}

// Dashboard types
export interface DashboardStats {
  activeRentals: number
  availableVehicles: number
  monthlyIncome: number
  nextReturn: {
    rental: Rental
    hoursRemaining: number
  } | null
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
