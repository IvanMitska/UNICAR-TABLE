import { Router, Response } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const router = Router()

// Download database backup using pg_dump
router.get('/', async (_req, res: Response) => {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    return res.status(500).json({ error: 'Database URL not configured' })
  }

  try {
    const filename = `unicar-backup-${new Date().toISOString().split('T')[0]}.sql`

    // Execute pg_dump with the DATABASE_URL
    const { stdout } = await execAsync(`pg_dump "${databaseUrl}" --no-owner --no-acl`)

    res.setHeader('Content-Type', 'application/sql')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(stdout)
  } catch (error) {
    console.error('Backup error:', error)
    res.status(500).json({ error: 'Failed to create backup. Make sure pg_dump is installed.' })
  }
})

export default router
