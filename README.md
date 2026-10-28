# POS Dream

## Run with Docker

From this directory:

```sh
docker compose up -d --build
```

- Frontend: http://localhost:3000
- API health: http://localhost:4000/health
- PostgreSQL browser administration (pgAdmin): http://localhost:5050

## Local development (hot reload)

Run PostgreSQL in Docker and the API and web app on your machine. Stop the
Docker `backend` and `frontend` containers first if they hold ports 4000/3000.

```sh
docker compose stop backend frontend
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d database pgadmin migrate

cd backend && npm install && npm run dev        # http://localhost:4000
cd POS_dream && npm install && npm run dev      # http://localhost:3000
```

The dev override publishes PostgreSQL on `127.0.0.1:5432` (`DEV_DB_PORT` to change).

`backend/.env` needs `PGHOST=localhost`, `PGPORT`, `PGDATABASE`, `PGUSER`,
`PGPASSWORD` and `JWT_SECRET`; `PORT`, `NODE_ENV` and `CORS_ORIGIN` are optional.
The web app defaults to `http://localhost:4000`; set `NUXT_PUBLIC_API_BASE` and
`NUXT_PUBLIC_SOCKET_URL` in `POS_dream/.env` to point elsewhere.

| Command | Where | Does |
| --- | --- | --- |
| `npm run dev` | backend | API with nodemon reload |
| `npm test` | backend | `node --test` suites in `tests/` |
| `npm run dev` | POS_dream | Nuxt dev server with HMR |
| `npm run typecheck` | POS_dream | vue-tsc over the Nuxt app |

## Project structure

```
backend/
  index.js                 HTTP server, Socket.IO, graceful shutdown
  app/app.js               Express app: middleware, routes, error handling
  app/config/env.js        Environment variables validated with zod
  app/config/db.js         PostgreSQL pool
  app/routes/index.js      Mounts feature modules under /api/v1
  app/modules/<feature>/   One folder per feature (routes, service, schemas)
  app/middlewares/         validate (zod), not-found, error-handler
  app/socket/index.js      Socket.IO setup; getIO() to emit from services
  app/utils/http-error.js  throw HttpError.notFound() etc. from handlers
  migrations/              SQL migrations (node-pg-migrate)
  tests/                   node:test suites

POS_dream/ (Nuxt 4, client-side rendered)
  app/pages/               Routes: /, /login, /pos, /tables, /kitchen, /settings
  app/layouts/             default (navigation rail) and blank (login, kitchen display)
  app/components/          Auto-imported Vue components
  app/composables/         useApi() for the API, useSocket() for realtime
  app/stores/              Pinia stores
  app/utils/               money (decimal.js, THB format), api-error, navigation
  app/plugins/             dayjs with Thai locale and Buddhist-era years
```

To add an API feature, create `backend/app/modules/<feature>/<feature>.routes.js`
and mount it in `backend/app/routes/index.js`.

## Database migrations

The `migrate` service applies pending migrations from `backend/migrations`
every time the stack starts; the backend waits for it to finish.

```sh
# Seed an owner account and a demo menu/floor plan (safe to re-run).
# Set SEED_OWNER_PIN (4-6 digits) in .env, or a PIN is generated and printed once.
docker compose run --rm migrate npm run seed

# Roll back the latest migration
docker compose run --rm migrate npm run migrate:down

# Create a new SQL migration (from backend/)
npm run migrate:create -- add-something
```

## Access PostgreSQL in a browser

Sign in to pgAdmin with the defaults below, or the values set in your `.env`:

- Email: `admin@example.com` (`PGADMIN_DEFAULT_EMAIL`)
- Password: `change-me-pgadmin` (`PGADMIN_DEFAULT_PASSWORD`)

Choose **Add New Server**, enter `POS Database` as the name, then enter these
values on the **Connection** tab:

| Field | Default value |
| --- | --- |
| Host name/address | `database` |
| Port | `5432` |
| Maintenance database | `pos` |
| Username | `pos` |
| Password | `change-me` |

Use your `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` values instead
if customized. Save the connection, then expand **Databases → pos → Schemas →
public → Tables**, or open **Query Tool** to execute SQL.

pgAdmin is bound to `127.0.0.1` and accessible on this computer. PostgreSQL stays
on the Docker network. pgAdmin settings persist in `pgadmin_data`, and database
data persists in `postgres_data`.

The initial pgAdmin login variables apply when its data volume is first created.
Change an existing account's password through pgAdmin.
