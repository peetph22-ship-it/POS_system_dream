const path = require('node:path')

const dotenv = require('dotenv')
const { z } = require('zod')

// Local development reads backend/.env; Docker Compose injects variables directly.
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true })

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().optional()
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
  throw new Error(`Invalid environment variables:\n${issues.join('\n')}`)
}

const env = parsed.data

module.exports = {
  ...env,
  isProduction: env.NODE_ENV === 'production',
  corsOrigins: env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}
