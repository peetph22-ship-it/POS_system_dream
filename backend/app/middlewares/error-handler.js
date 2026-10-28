const env = require('../config/env')

// Express 5 forwards rejected promises from async handlers here automatically.
function errorHandler(error, _req, res, _next) {
  // body-parser marks malformed JSON and oversized payloads with a status.
  const status = error.status || error.statusCode || 500
  if (status >= 500) {
    console.error(error)
  }

  const body = {
    message: status >= 500 && env.isProduction ? 'Internal Server Error' : error.message
  }
  if (error.details) {
    body.details = error.details
  }
  res.status(status).json(body)
}

module.exports = errorHandler
