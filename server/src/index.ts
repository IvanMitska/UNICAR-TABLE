import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase } from './db/database.js'
import authRoutes from './routes/auth.js'
import vehiclesRoutes from './routes/vehicles.js'
import clientsRoutes from './routes/clients.js'
import rentalsRoutes from './routes/rentals.js'
import maintenanceRoutes from './routes/maintenance.js'
import expensesRoutes from './routes/expenses.js'
import reportsRoutes from './routes/reports.js'
import notificationsRoutes from './routes/notifications.js'
import backupRoutes from './routes/backup.js'
import { authMiddleware } from './middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(express.json())
app.use(cookieParser())

// CORS - only needed in development
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }))
}

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: { error: 'Too many requests, please try again later' },
})

// Routes
app.use('/api/auth', authLimiter, authRoutes)

// Protected routes
app.use('/api/vehicles', authMiddleware, vehiclesRoutes)
app.use('/api/clients', authMiddleware, clientsRoutes)
app.use('/api/rentals', authMiddleware, rentalsRoutes)
app.use('/api/maintenance', authMiddleware, maintenanceRoutes)
app.use('/api/expenses', authMiddleware, expensesRoutes)
app.use('/api/reports', authMiddleware, reportsRoutes)
app.use('/api/notifications', authMiddleware, notificationsRoutes)
app.use('/api/backup', authMiddleware, backupRoutes)

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientPath))

  // Handle client-side routing
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'))
  })
}

// Initialize database and start server
async function start() {
  try {
    await initDatabase()

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
