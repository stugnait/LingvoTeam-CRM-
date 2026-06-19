# Lingvo

## Docker

Run the whole stack with PostgreSQL:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- PostgreSQL from host: localhost:5433
- PostgreSQL inside Docker: db:5432

Docker Compose reads real values from `api/.env` and `front/.env`.
Keep secrets and environment-specific values in those files.

Required variables:

`api/.env`:

```env

```

`front/.env`:

```env

```

Inside Docker, the API service overrides `DB_HOST` to the Postgres service name
`db`; keep the actual database credentials in `api/.env`.
