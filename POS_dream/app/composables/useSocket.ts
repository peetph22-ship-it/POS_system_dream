import { io, type Socket } from 'socket.io-client'

let socket: Socket | undefined

// One shared Socket.IO connection for the whole app (kitchen display, table updates).
export function useSocket() {
  if (!socket) {
    const config = useRuntimeConfig()
    socket = io(config.public.socketUrl, { withCredentials: true })
  }
  return socket
}
