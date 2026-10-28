const { Pool } = require('pg')

// Containers on pos_network reach PostgreSQL using its Compose service name.
// DATABASE_URL can override this configuration for an external database.
const config = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'database',
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE || 'pos',
      user: process.env.PGUSER || 'pos',
      password: process.env.PGPASSWORD
    }

if (!config.connectionString && !config.password) {
  throw new Error('Set DATABASE_URL or PGPASSWORD to connect to PostgreSQL')
}

const pool = new Pool({
  ...config,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message)
})

module.exports = pool
