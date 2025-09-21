# Async Fibonacci Server

This is a server that provides an API for calculating Fibonacci numbers.

## Getting Started

- Navigate to the worker directory

### Prerequisites

- Ensure you have [Node.js](https://nodejs.org/) (which includes `npm`) installed on your system.
- PostgreSQL running and reachable
- Redis running and reachable

### Step 1 - Install Dependencies

```bash
npm install
```

### Step 2 - Configure Environment Variables

Copy the example file and fill in values:

```bash
cp .env.example .env
```

Key variables (see `.env.example`):

```ini
# Security & limits
TRUST_PROXY=0
JSON_LIMIT=1mb
RATE_LIMIT_MAX=100
CORS_ORIGINS=http://localhost:5173

# HTTP timeouts (Node server)
KEEP_ALIVE_TIMEOUT_MS=60000
HEADERS_TIMEOUT_MS=65000

# Logging
LOG_LEVEL=info

# Postgres
# POSTGRES_URL=postgres://learninglab:password@localhost:5432/fibonacci
POSTGRES_URL=...

# Redis
# (without auth): REDIS_URL=redis://localhost:6379
# (with auth): REDIS_URL=redis://:redis@redis:6379
# REDIS_URL=redis://localhost:6379
REDIS_URL=...
```

- **`TRUST_PROXY`** - Set to `1` if running behind a proxy (e.g., Nginx) to trust the proxy's headers.
- **`JSON_LIMIT`** - The maximum size of JSON requests (e.g., `1mb`).
- **`RATE_LIMIT_MAX`** - The maximum number of requests allowed per 15-minute window (e.g., `100`).
- **`CORS_ORIGINS`** - Comma-separated list of allowed origins for CORS (e.g., `http://localhost:5173`).
- **`KEEP_ALIVE_TIMEOUT_MS`** - The maximum keep-alive timeout in milliseconds (e.g., `60000`).
- **`HEADERS_TIMEOUT_MS`** - The maximum headers timeout in milliseconds (e.g., `65000`).
- **`LOG_LEVEL`** - The logging level for the server. Valid values are `debug`, `info`, `warn`, `error`, etc.
    - The server logs to console and to `server/server.log` (see `src/config/logger.js`). Control verbosity via `LOG_LEVEL`.
- **`POSTGRES_URL`** - The URL of the Postgres database to connect to.
- **`REDIS_URL`** - The URL of the Redis server to connect to.

> Security: `.env` is gitignored. Do not commit it.

### Step 3 - Database Migrations

View migration status

```bash
npm run migrate:status
```

Apply migrations

```bash
npm run migrate:up
```

Rollback last migration (if something goes wrong)
```bash
npm run migrate:down
```

### Step 4 - Run the Server

```bash
# development (auto-restart)
npm run dev

# production
npm run start
```

Server listens on http://localhost:5000. Note: this port is hardcoded as whole ecosystem is built around it, we tried making it env var but for few files in the ecosystem we were unable to read it dynamically.

## Endpoints

- Health/Readiness
  - `GET /health` -> `{ status: "OK" }`
  - `GET /ready` -> `{ ready: true|false }` (checks Postgres and Redis)

- Fibonacci (API v1)
  - `GET /api/v1/fibonacci/most-requested` -> `{ most_requested: { index, count } | null }`
  - `GET /api/v1/fibonacci/calculated/:index` -> `{ calculated_value: number|null }`
  - `POST /api/v1/fibonacci/calculate/:index` -> `{ working: true }` or `409 Already calculated`
  - Validation: index must be an integer 0-40

- Ops (local only)
  - `GET /api/ops/deadletter/len` -> `{ length }`
  - `GET /api/ops/deadletter?start=0&stop=49` -> `{ items, start, stop }`

## How It Works

- Handle Calculate Request
  - Validate incoming Fibonacci index (0-40 range).
  - Log request to PostgreSQL for permanent history tracking.
  - Check Redis cache for existing calculated value.
  - If already computed, return 409 (idempotent behavior).
  - If not cached, enqueue index to Redis queue for worker processing.
  - Return immediate response indicating work is in progress.
- Handle Calculated Request
  - Validate incoming Fibonacci index (0-40 range).
  - Check Redis cache for the computed result.
  - Return the cached value or null if not yet computed.
- Data Flow
  - **PostgreSQL**: Permanent storage of request history (requested indices only).
  - **Redis**: Temporary coordination and caching of computed Fibonacci values.

## Graceful Shutdown

On SIGINT/SIGTERM, the server stops accepting new connections, closes the HTTP server, and shuts down Postgres/Redis clients.

## Notes

- No session state; can be horizontally scaled behind a load balancer.
- Port 5000 is hardcoded as whole ecosystem is built around it, we tried making it env var but for few files in the ecosystem we were unable to read it dynamically.
