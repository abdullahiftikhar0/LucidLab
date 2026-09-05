const admin = require("firebase-admin");
const { createClient } = require("@supabase/supabase-js");
const { env } = require("../config/env");

let initialized = false;
function initFirebaseAdmin() {
  if (initialized) return;
  if (!admin.apps.length) {
    const hasInlineCreds =
      env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey;
    console.log("[firebase-admin] Has inline creds:", hasInlineCreds);
    if (hasInlineCreds) {
      console.log("[firebase-admin] Initializing with projectId:", env.firebaseProjectId);
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.firebaseProjectId,
          clientEmail: env.firebaseClientEmail,
          privateKey: env.firebasePrivateKey,
        }),
      });
    } else {
      console.log("[firebase-admin] Initializing without explicit credentials (using default)");
      admin.initializeApp();
    }
  }
  initialized = true;
}

function getFirestore() {
  initFirebaseAdmin();
  return admin.firestore();
}

function getSupabaseAdmin() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Supabase env not configured");
  }
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
}

module.exports = { initFirebaseAdmin, getFirestore, getSupabaseAdmin };
