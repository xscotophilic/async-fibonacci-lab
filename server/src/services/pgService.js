const pgClient = require("../config/pgClient");
const logger = require("../config/logger");

class PgService {
  constructor() {
    this.client = pgClient;
  }

  async init() {
    try {
      await this.client.query("SELECT 1");
    } catch (err) {
      logger.error("[PgService][init] DB connectivity check failed: %O", err);
      throw err;
    }
  }

  async getMostRequested() {
    try {
      const result = await this.client.query(
        "SELECT * from fibonacci_requests_metadata ORDER BY count DESC LIMIT 1"
      );
      return result.rows;
    } catch (err) {
      logger.error("[PgService][getMostRequested] Error: %O", err);
      throw err;
    }
  }

  async logRequest(index) {
    try {
      await this.client.query(
        `
        INSERT INTO fibonacci_requests_metadata (number, count)
        VALUES ($1, 1)
        ON CONFLICT (number)
        DO UPDATE SET count = fibonacci_requests_metadata.count + 1
        `,
        [index]
      );
    } catch (err) {
      logger.error("[PgService][logRequest] Error logging request for index %s: %O", index, err);
      throw err;
    }
  }

  async close() {
    try {
      await pgClient.end();
      logger.info("[PgService] Postgres pool closed");
    } catch (err) {
      logger.error("[PgService][close] Error closing Postgres pool: %O", err);
    }
  }
}

module.exports = new PgService();
