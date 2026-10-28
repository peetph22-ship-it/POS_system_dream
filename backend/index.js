const path = require('node:path')

const compression = require('compression')
const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const helmet = require('helmet')

// Local development reads backend/.env; Docker Compose injects variables directly.
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true })

// Import API routes here when they are implemented.

const port = Number(process.env.PORT || 4000)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const app = express()
app.disable('x-powered-by')
app.use(helmet())
app.use(compression())
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json({ limit: '1mb' }))

// Register API routes here, before the 404 handler.

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

// Keep this after all routes so unmatched requests return a JSON response.
app.use((req, res) => res.status(404).json({ message: 'Invalid Route' }))

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`POS API listening on port ${port}`)
})

function shutdown(signal) {
  console.log(`${signal} received, shutting down`)
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
