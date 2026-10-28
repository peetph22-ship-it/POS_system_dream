// Error body returned by the backend error handler.
export interface ApiErrorBody {
  message: string
  details?: { path: string, message: string }[]
}

export interface HealthResponse {
  status: 'ok' | 'error'
  database?: 'ok' | 'unreachable'
}
