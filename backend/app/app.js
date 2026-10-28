const compression = require('compression')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const express = require('express')
const helmet = require('helmet')

const env = require('./config/env')
const errorHandler = require('./middlewares/error-handler')
const notFound = require('./middlewares/not-found')
const healthRoutes = require('./modules/health/health.routes')
const apiRoutes = require('./routes')

function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(compression())
  app.use(cors({ origin: env.corsOrigins, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  app.use('/health', healthRoutes)
  app.use('/api/v1', apiRoutes)

  // Keep these last so unmatched requests and errors return JSON.
  app.use(notFound)
  app.use(errorHandler)

  return app
}

module.exports = createApp
