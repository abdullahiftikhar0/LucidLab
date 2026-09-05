const admin = require("firebase-admin");
const { initFirebaseAdmin } = require("../services/clients");

async function requireAuth(req, res, next) {
  try {
    initFirebaseAdmin();
    const auth = req.headers.authorization || "";
    const match = auth.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      console.log("[auth] Missing bearer token");
      return res.status(401).json({ error: "Missing bearer token" });
    }
    const token = match[1];
    console.log("[auth] Verifying token, length:", token.length);
    const decoded = await admin.auth().verifyIdToken(token);
    console.log("[auth] Token verified for uid:", decoded.uid);
    req.user = decoded;
    return next();
  } catch (error) {
    console.error("[auth] Token verification failed:", error.message);
    return res.status(401).json({ error: "Invalid auth token" });
  }
}

module.exports = { requireAuth };
