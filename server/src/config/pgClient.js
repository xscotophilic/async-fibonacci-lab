const { Pool } = require("pg");

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error(
    "POSTGRES_URL is required but not set. Example: postgres://user:pass@host:5432/db?sslmode=disable"
  );
}

const pgClient = new Pool({ connectionString });

module.exports = pgClient;
