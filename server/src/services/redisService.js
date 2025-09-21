const fs = require("fs");
const path = require("path");

const redisClient = require("../config/redisClient");
const logger = require("../config/logger");

const JOB_QUEUE_KEY = "fib:index_queue";
const PROCESSING_QUEUE_KEY = "fib:index_processing";
const enqueueJobIfNotExistsScript = fs.readFileSync(
  path.join(__dirname, "../scripts/enqueueJobIfNotExists.lua"),
  "utf8"
);

class RedisService {
  constructor() {
    this.client = redisClient;
  }

  async init() {
    try {
      await this.client.ping();
    } catch (err) {
      logger.error("[RedisService][init] Redis connectivity check failed: %O", err);
      throw err;
    }
  }

  async getCalculatedValue(index) {
    try {
      const value = await this.client.hGet("fibonacci_values", index);
      return value;
    } catch (err) {
      logger.error(
        "[RedisService][getCalculatedValue] Error fetching calculated value for index %s: %O",
        index,
        err
      );
      throw err;
    }
  }

  async requestFibonacciComputation(index) {
    try {
      const didEnqueue = await this.client.eval(enqueueJobIfNotExistsScript, {
        keys: ["fibonacci_values", JOB_QUEUE_KEY, PROCESSING_QUEUE_KEY],
        arguments: [String(index), "Calculating..."],
      });
      return didEnqueue === 1;
    } catch (err) {
      logger.error(
        "[RedisService][requestFibonacciComputation] Error requesting computation for index %s: %O",
        index,
        err
      );
      throw err;
    }
  }

  async close() {
    try {
      await this.client.quit();
      logger.info("[RedisService] Redis client closed");
    } catch (err) {
      logger.error("[RedisService][close] Error closing Redis client: %O", err);
    }
  }
}

module.exports = new RedisService();
