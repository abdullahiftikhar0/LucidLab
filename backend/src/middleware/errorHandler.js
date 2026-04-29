function errorHandler(err, req, res, next) {
  const status = Number(err?.status) || 500;
  const message = err?.message || "Internal server error";
  if (status >= 500) {
    console.error("[backend] unhandled error", err);
  }
  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
