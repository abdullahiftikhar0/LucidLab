const express = require("express");

const router = express.Router();

/** Liveness: no deps, no logging — for Render health checks and external keep-alive cron. */
function pingHandler(_req, res) {
  res.status(204).end();
}

router.get("/ping", pingHandler);
router.head("/ping", pingHandler);

/** Readiness-style check for humans and monitors (still lightweight). */
router.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

module.exports = { healthRouter: router };
