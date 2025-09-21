const express = require("express");

const logger = require("../config/logger");
const pgService = require("../services/pgService");
const redisService = require("../services/redisService");

const router = express.Router();

router.get("/most-requested", async (req, res) => {
  try {
    const mostRequested = await pgService.getMostRequested();
    if(mostRequested.length === 0){
      return res.status(404).json({ most_requested: null });
    }
    res.json({ most_requested: mostRequested[0] });
  } catch (error) {
    logger.error("[Route][most-requested] Error: %O", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/calculated/:index", async (req, res) => {
  try {
    const index = req.params.index;
    if (index === undefined || index === null || index === "") {
      return res.status(422).json({error: "Index is required"});
    }
    if (typeof index === "string" && index.trim() === "") {
      return res.status(422).json({error: "Index is required"});
    }
    if (isNaN(index)) {
      return res.status(422).json({error: "Index must be a number"});
    }
    if (!Number.isInteger(Number(index))) {
      return res.status(422).json({error: "Index must be an integer"});
    }
    if (Number(index) < 0 || Number(index) > 40) {
      return res.status(422).json({error: "Index must be between 0 and 40"});
    }

    const calculatedValue = await redisService.getCalculatedValue(req.params.index);
    res.json({ calculated_value: calculatedValue });
  } catch (error) {
    logger.error("[Route][calculated/:index] Error: %O", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/calculate/:index", async (req, res) => {
  try {
    const index = req.params.index;
    if (index === undefined || index === null || index === "") {
      return res.status(422).json({error: "Index is required"});
    }
    if (typeof index === "string" && index.trim() === "") {
      return res.status(422).json({error: "Index is required"});
    }
    if (isNaN(index)) {
      return res.status(422).json({error: "Index must be a number"});
    }
    if (!Number.isInteger(Number(index))) {
      return res.status(422).json({error: "Index must be an integer"});
    }
    if (Number(index) < 0 || Number(index) > 40) {
      return res.status(422).json({error: "Index must be between 0 and 40"});
    }

    const calculatedValue = await redisService.getCalculatedValue(String(index));
    if (calculatedValue !== null) {
      await pgService.logRequest(String(index));
      return res.status(409).json({ error: 'Already calculated', index: Number(index) });
    }

    await Promise.all([
      pgService.logRequest(String(index)),
      redisService.requestFibonacciComputation(String(index)),
    ]);

    res.json({ working: true });
  } catch (error) {
    logger.error("[Route][calculate/:index] Error: %O", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
