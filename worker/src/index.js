require("dotenv").config();

const { calculateFib } = require("./shared/fib");
const logger = require("./config/logger");
const redisService = require("./services/redisService");

async function startWorker() {
  try {
    await redisService.init();
    await redisService.storeValues({ 0: 0, 1: 1 });

    logger.info("Worker is working...");

    const handleShutdownSignal = async (signal) => {
      try {
        logger.info("[Worker] Received %s. Shutting down...", signal);
        await redisService.enqueueStopToken();
        logger.info("[Worker] Consumer stopped.");
      } catch (err) {
        logger.error("[Worker] Error while requesting stop: %O", err);
      }
    };

    process.on("SIGINT", () => handleShutdownSignal("SIGINT"));
    process.on("SIGTERM", () => handleShutdownSignal("SIGTERM"));

    // this will block the process until the consumer is stopped
    await redisService.processJobsUntilStopped(calculateFib);

    await redisService.close();
  } catch (error) {
    logger.error("[Worker] Failed to start worker: %O", error);
    process.exit(1);
  }
}

if (require.main === module) {
  startWorker();
}

module.exports = { startWorker };
