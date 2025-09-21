const fs = require("fs");
const path = require("path");

const redisClient = require("../config/redisClient");
const logger = require("../config/logger");

const MAX_RETRIES = 3;
const STOP_TOKEN_PREFIX = "__STOP__:";

const MAX_INDEX_KEY = "fib:max_index";
const FAIL_COUNT_KEY = "fib:index_fail_counts";

const JOB_QUEUE_KEY = "fib:index_queue";
const PROCESSING_QUEUE_KEY = "fib:index_processing";
const DEAD_LETTER_QUEUE_KEY = "fib:index_deadletter";

const setMaxIndexIfGreaterScript = fs.readFileSync(
  path.join(__dirname, "../scripts/setMaxIndexIfGreater.lua"),
  "utf8"
);

class RedisService {
  constructor() {
    this.client = redisClient;
    this.controlClient = null;
    this.stopToken = `${STOP_TOKEN_PREFIX}${Math.random().toString(36).slice(2, 10)}`;
  }

  async init() {
    try {
      await this.client.ping();
    } catch (err) {
      logger.error("[RedisService][init] Redis connectivity check failed: %O", err);
      throw err;
    }

    try {
      this.controlClient = this.client.duplicate();
      if (this.controlClient && this.controlClient.connect) {
        await this.controlClient.connect();
      }
    } catch (err) {
      logger.error(
        "[worker][RedisService][init] Failed to init control client: %O",
        err
      );
      throw err;
    }
  }

  async processJobsUntilStopped(calculateFib) {
    // process in-flight jobs (if any)
    try {
      let len = await this.client.lLen(PROCESSING_QUEUE_KEY);
      while (len && len > 0) {
        await this.client.rPopLPush(PROCESSING_QUEUE_KEY, JOB_QUEUE_KEY);
        len = await this.client.lLen(PROCESSING_QUEUE_KEY);
      }
    } catch (err) {
      logger.error(
        "[worker][RedisService][consumeQueue] Recovery error: %O",
        err
      );
    }

    // Continuously consume jobs
    while (true) {
      let index;
      try {
        const message = await this.client.brPopLPush(
          JOB_QUEUE_KEY,
          PROCESSING_QUEUE_KEY,
          0
        );

        if (typeof message === "string" && message.startsWith(STOP_TOKEN_PREFIX)) {
          if (message === this.stopToken) {
            await this.client.lRem(PROCESSING_QUEUE_KEY, 1, message);
            break;
          } else {
            // Not my token - re-queue for the intended worker
            await this.client.lRem(PROCESSING_QUEUE_KEY, 1, message);
            await this.client.rPush(JOB_QUEUE_KEY, message);
            continue;
          }
        }

        index = parseInt(message);
        if (isNaN(index)) {
          await this.client.lRem(PROCESSING_QUEUE_KEY, 1, message);
          continue;
        }

        const fibCacheState = await this.getMaxIndexAndCachedValues();
        if (
          fibCacheState.maxIndex !== null &&
          fibCacheState.maxIndex >= index
        ) {
          await this.client.lRem(PROCESSING_QUEUE_KEY, 1, message);
          continue;
        }

        const calculatedValues = await calculateFib(index, fibCacheState);

        await this.storeValues(calculatedValues);
        await this.storeMaxIndex(index);

        await this.client.lRem(PROCESSING_QUEUE_KEY, 1, message);

        try {
          await this.client.hDel(FAIL_COUNT_KEY, String(index));
        } catch (e) {
          logger.warn(
            "[worker][RedisService][consumeQueue] Failed to reset fail count for %s: %O",
            String(index),
            e
          );
        }
      } catch (err) {
        logger.error(
          "[worker][RedisService][consumeQueue] Queue consume error: %O",
          err
        );

        if (typeof index === "number" && !isNaN(index)) {
          try {
            const failures = await this.client.hIncrBy(
              FAIL_COUNT_KEY,
              String(index),
              1
            );

            if (failures >= MAX_RETRIES) {
              await this.client.hDel("fibonacci_values", String(index));
              await this.client.rPush(DEAD_LETTER_QUEUE_KEY, String(index));
              await this.client.lRem(PROCESSING_QUEUE_KEY, 1, String(index));
              logger.error(
                "[worker][RedisService] Index %s moved to dead-letter after %d failures",
                String(index),
                failures
              );
            } else {
              await new Promise((r) => setTimeout(r, Math.min(300 * failures, 1500)));
              await this.client.rPush(JOB_QUEUE_KEY, String(index));
              await this.client.lRem(PROCESSING_QUEUE_KEY, 1, String(index));
              logger.warn(
                "[worker][RedisService] Re-queued index %s (attempt %d/%d)",
                String(index),
                failures,
                MAX_RETRIES
              );
            }
          } catch (e) {
            logger.error(
              "[worker][RedisService] Failure-handling error for index %s: %O",
              String(index),
              e
            );
            await new Promise((r) => setTimeout(r, 1000));
          }
        } else {
          // Operation failed, retry after a short delay
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }

  async enqueueStopToken() {
    try {
      await this.controlClient.rPush(JOB_QUEUE_KEY, this.stopToken);
    } catch (err) {
      logger.error(
        "[worker][RedisService][stopConsuming] Error enqueuing stop token: %O",
        err
      );
      throw err;
    }
  }

  async removeValue(key) {
    try {
      await this.client.hDel("fibonacci_values", key);
    } catch (err) {
      logger.error(
        "[worker][RedisService][removeValue] Error removing key %s: %O",
        key,
        err
      );
      throw err;
    }
  }

  async storeValue(key, value) {
    try {
      await this.client.hSet("fibonacci_values", key, value);
    } catch (err) {
      logger.error(
        "[worker][RedisService][storeValue] Error storing key %s: %O",
        key,
        err
      );
      throw err;
    }
  }

  async storeValues(values) {
    try {
      await this.client.hSet("fibonacci_values", values);
    } catch (err) {
      logger.error(
        "[worker][RedisService][storeValues] Error storing values: %O",
        err
      );
      throw err;
    }
  }

  async getValue(key) {
    try {
      const value = await this.client.hGet("fibonacci_values", key);
      return value !== null ? parseInt(value) : null;
    } catch (err) {
      logger.error(
        "[worker][RedisService][getValue] Error getting key %s: %O",
        key,
        err
      );
      throw err;
    }
  }

  async storeMaxIndex(index) {
    try {
      await this.client.eval(setMaxIndexIfGreaterScript, {
        keys: [MAX_INDEX_KEY],
        arguments: [String(index)],
      });
    } catch (err) {
      logger.error(
        "[worker][RedisService][storeMaxIndex] Error storing max index %s: %O",
        index,
        err
      );
      throw err;
    }
  }

  async getMaxIndexAndCachedValues() {
    try {
      const rawMaxIndex = await this.client.get(MAX_INDEX_KEY);
      let maxIndex = rawMaxIndex !== null ? parseInt(rawMaxIndex) : null;
      let maxValue = null;
      let maxMinusOneValue = null;

      if (maxIndex === null) {
        maxIndex = 1;
        maxValue = 1;
        maxMinusOneValue = 0;
      } else {
        const [curr, prev] = await this.client.hmGet("fibonacci_values", [
          String(maxIndex),
          String(maxIndex - 1),
        ]);
        if (curr !== null && prev !== null) {
          maxValue = parseInt(curr);
          maxMinusOneValue = parseInt(prev);
        } else {
          maxIndex = 1;
          maxValue = 1;
          maxMinusOneValue = 0;
        }
      }

      return {
        maxIndex: maxIndex,
        [maxIndex]: maxValue,
        [maxIndex - 1]: maxMinusOneValue,
      };
    } catch (err) {
      logger.error(
        "[worker][RedisService][getMaxIndexAndCachedValues] Error: %O",
        err
      );
      throw err;
    }
  }

  async close() {
    try {
      if (this.client && this.client.quit) {
        await this.client.quit();
      }
      if (this.controlClient && this.controlClient.quit) {
        await this.controlClient.quit();
      }
      logger.info("[worker][RedisService] Redis client closed");
    } catch (err) {
      logger.error(
        "[worker][RedisService][close] Error closing Redis client: %O",
        err
      );
    }
  }
}

module.exports = new RedisService();
