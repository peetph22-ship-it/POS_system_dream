const { Router } = require('express')

const pool = require('../../config/db')

const router = Router()

// Liveness: the process is up. Used by the Docker healthcheck.
router.get('/', (_req, res) => {
  res.json({ status: 'ok' })
})

// Readiness: the API can reach PostgreSQL.
router.get('/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'ok' })
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable' })
  }
})

module.exports = router
