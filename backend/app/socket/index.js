const { Server } = require('socket.io')

const env = require('../config/env')

let io

// Attaches Socket.IO to the HTTP server. Register event handlers (kitchen
// display, table status, ...) inside the connection callback.
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true }
  })

  io.on('connection', (socket) => {
    if (!env.isProduction) {
      console.log(`Socket connected: ${socket.id}`)
    }
  })

  return io
}

// Lets services emit events, e.g. getIO().emit('order:updated', order).
function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialised')
  }
  return io
}

module.exports = { initSocket, getIO }
