// Throw from routes or services to send a specific status and message to the client.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.details = details
  }

  static badRequest(message = 'Bad Request', details) {
    return new HttpError(400, message, details)
  }

  static unauthorized(message = 'Unauthorized') {
    return new HttpError(401, message)
  }

  static forbidden(message = 'Forbidden') {
    return new HttpError(403, message)
  }

  static notFound(message = 'Not Found') {
    return new HttpError(404, message)
  }

  static conflict(message = 'Conflict', details) {
    return new HttpError(409, message, details)
  }
}

module.exports = HttpError
