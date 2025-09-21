# Production Guide: Managed Postgres and Redis

This document helps you provision managed Postgres and Redis suitable for development and entry-level production. It preserves parity with fully managed production setups while minimizing operational overhead.

- Prefer managed over self-hosted for parity with production and reduced ops.

## Managed Postgres and Redis (Free Tiers)

Use these providers to get connection URLs you can place into the `.env` files (`POSTGRES_URL`, `REDIS_URL`).

### Postgres (free/dev tiers)
- Neon (Serverless Postgres)
  - https://neon.tech
  - SSL required. Connection string often looks like: `postgres://<user>:<pass>@<host>.neon.tech/<db>?sslmode=require`

### Redis (free/dev tiers)
- Redis Cloud (Free plan)
  - https://redis.com/try-free/
  - `rediss://:<password>@<host>:<port>` (TLS)

## Configuration and Operational Best Practices
- Security
  - Enforce TLS: `sslmode=require` for Postgres; `rediss://` for Redis.
  - Use distinct credentials/roles for application vs. admin/maintenance tasks.
  - Rotate credentials on a set cadence; prefer short-lived tokens where supported.
- Networking
  - Restrict inbound access via IP allowlists, VPC peering, or private endpoints where available.
- Performance
  - Apply database migrations before first use to ensure schema consistency.
- Resilience
  - Enable automated backups and set appropriate retention.
  - Prefer managed high-availability options when moving beyond toy workloads.

## Troubleshooting
- Connection issues
  - Verify network allowlists and required TLS settings.
  - Check for too-small or too-large pool sizes causing exhaustion or excessive churn.
- Auth failures
  - Confirm username/password or role assignments; ensure credentials are current after rotation.
- SSL/TLS issues
  - Ensure `sslmode=require` (Postgres) and `rediss://` (Redis). Some environments require CA bundles.

