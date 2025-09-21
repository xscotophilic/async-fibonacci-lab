require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const logger = require("./config/logger");
const pgService = require("./services/pgService");
const redisService = require("./services/redisService");

const corsMiddleware = require("./middlewares/cors");
const malformedJsonHandler = require("./middlewares/malformedJsonHandler");
const allowLocalOnly = require("./middlewares/allowLocalOnly");

let server;

const app = express();

// Middleware
if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: process.env.JSON_LIMIT || "1mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Catch malformed JSON
app.use(malformedJsonHandler);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// Readiness check
app.get("/ready", async (req, res) => {
  try {
    await pgService.client.query("SELECT 1");
    await redisService.client.ping();
    res.json({ ready: true });
  } catch (e) {
    logger.error("[Server][ready] Readiness check failed: %O", e);
    res.status(503).json({ ready: false });
  }
});

// API routes
app.use("/api/ops", allowLocalOnly, require("./routes/ops"));
app.use("/api/v1/fibonacci", require("./routes/fibonacci"));

// Error handling
app.use((err, req, res, next) => {
  logger.error("Unhandled error: %O", err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = 5000;

async function shutdown(signal) {
  logger.info("[Server] Received %s. Shutting down...", signal);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info("[Server] HTTP server closed");
    }
  } catch (err) {
    logger.error("[Server] Error closing HTTP server: %O", err);
  }

  await Promise.allSettled([pgService.close?.(), redisService.close?.()]);

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

async function startServer() {
  try {
    await pgService.init();
    await redisService.init();
    server = app
      .listen(PORT, () => {
        logger.info(`Server listening on port ${PORT}`);
      })
      .on("error", (error) => {
        logger.error("Server error: %O", error);
      });

    // Set HTTP timeouts
    server.keepAliveTimeout = Number(process.env.KEEP_ALIVE_TIMEOUT_MS || 60000);
    server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS || 65000);
  } catch (error) {
    logger.error("Failed to start server: %O", error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
