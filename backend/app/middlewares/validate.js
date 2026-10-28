const HttpError = require('../utils/http-error')

// Validates req.body / req.query / req.params against zod schemas and replaces them
// with the parsed values, e.g. router.post('/', validate({ body: schema }), handler).
function validate(schemas) {
  return (req, _res, next) => {
    for (const [key, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[key])
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          path: [key, ...issue.path].join('.'),
          message: issue.message
        }))
        return next(HttpError.badRequest('Validation failed', details))
      }
      // Express 5 exposes req.query as a getter, so redefine it instead of assigning.
      Object.defineProperty(req, key, { value: result.data, writable: true, enumerable: true })
    }
    next()
  }
}

module.exports = validate
