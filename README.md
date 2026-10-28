# POS Dream

## Run with Docker

From this directory:

```sh
docker compose up -d --build
```

- Frontend: http://localhost:3000
- API health: http://localhost:4000/health
- PostgreSQL browser administration (pgAdmin): http://localhost:5050

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
