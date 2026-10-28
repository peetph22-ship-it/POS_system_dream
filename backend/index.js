const http = require('node:http')

const env = require('./app/config/env')
const pool = require('./app/config/db')
const createApp = require('./app/app')
const { initSocket } = require('./app/socket')

const app = createApp()
const server = http.createServer(app)
const io = initSocket(server)

server.listen(env.PORT, '0.0.0.0', () => {
  console.log(`POS API listening on port ${env.PORT}`)
})

function shutdown(signal) {
  console.log(`${signal} received, shutting down`)
  io.close()
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
