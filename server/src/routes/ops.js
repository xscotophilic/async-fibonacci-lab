const express = require("express");

const logger = require("../config/logger");
const redisService = require("../services/redisService");

const router = express.Router();

const DEAD_LETTER_QUEUE_KEY = "fib:index_deadletter";

router.get("/deadletter/len", async (req, res) => {
  try {
    const len = await redisService.client.lLen(DEAD_LETTER_QUEUE_KEY);
    res.json({ length: len });
  } catch (err) {
    logger.error("[Ops][deadletter/len] Error: %O", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/deadletter", async (req, res) => {
  try {
    const start = Number.isInteger(Number(req.query.start))
      ? Number(req.query.start)
      : 0;
    const stop = Number.isInteger(Number(req.query.stop))
      ? Math.min(Number(req.query.stop), start + 49)
      : start + 49;

    if (start < 0 || stop < start) {
      return res.status(422).json({ error: "Invalid range" });
    }

    const items = await redisService.client.lRange(
      DEAD_LETTER_QUEUE_KEY,
      start,
      stop
    );
    res.json({ items: items, start: start, stop: stop });
  } catch (err) {
    logger.error("[Ops][deadletter] Error: %O", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
