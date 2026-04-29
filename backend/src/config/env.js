const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

function read(name, fallback = "") {
  const value = process.env[name];
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function readInt(name, fallback) {
  const raw = read(name, "");
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

const env = {
  nodeEnv: read("NODE_ENV", "development"),
  port: readInt("BACKEND_PORT", 5055),
  geminiApiKey: read("GEMINI_API_KEY", ""),
  geminiModel: read("GEMINI_MODEL", "gemini-2.5-flash"),
  firebaseProjectId: read("FIREBASE_PROJECT_ID", ""),
  firebaseClientEmail: read("FIREBASE_CLIENT_EMAIL", ""),
  firebasePrivateKey: read("FIREBASE_PRIVATE_KEY", "").replace(/\\n/g, "\n"),
  supabaseUrl: read("SUPABASE_URL", ""),
  supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY", ""),
};

module.exports = { env };
