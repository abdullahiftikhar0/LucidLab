const express = require("express");
const { healthRouter } = require("./routes/health");
const { aiRouter } = require("./routes/ai");
const { storageRouter } = require("./routes/storage");
const { firestoreRouter } = require("./routes/firestore");
const { sketchfabRouter } = require("./routes/sketchfab");
const { errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));
  const quietPaths = new Set(["/ping", "/api/health"]);
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      if (req.path.startsWith("/api/") && !quietPaths.has(req.path)) {
        console.log(`[api] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
      }
    });
    next();
  });
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).end();
    return next();
  });

  app.use(healthRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/storage", storageRouter);
  app.use("/api/sketchfab", sketchfabRouter);
  app.use("/api", firestoreRouter);

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
