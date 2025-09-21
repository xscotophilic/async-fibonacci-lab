const redis = require("redis");
const logger = require("./logger");

const url = process.env.REDIS_URL;
if (!url) {
  throw new Error(
    "REDIS_URL is required but not set. Example: redis://localhost:6379"
  );
}

const redisClient = redis.createClient({
  url,
});

redisClient.on("error", (err) => {
  logger.error("[redisClient] Redis connection error: %O", err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error("[redisClient] Failed to connect to Redis: %O", err);
  }
})();

module.exports = redisClient;
