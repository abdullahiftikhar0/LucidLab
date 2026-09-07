const express = require("express");
const { getSupabaseAdmin } = require("../services/clients");
const { uploadBuffer } = require("../services/storageUpload");
const { searchModels, fetchModelGlbBuffer } = require("../services/sketchfab");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function sanitizeObjectName(raw) {
  const trimmed = String(raw || "")
    .trim()
    .replace(/\.glb$/i, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return trimmed;
}

async function objectTypeExists(uid, objectName) {
  const supabase = getSupabaseAdmin();
  const path = `${uid}/${objectName}.glb`;
  const { data, error } = await supabase.storage.from("object-types").list(`${uid}/`, {
    search: `${objectName}.glb`,
  });
  if (error) return false;
  return (data || []).some((item) => item.name.toLowerCase() === `${objectName}.glb`.toLowerCase());
}

router.get("/search", requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const data = await searchModels(q, { cursor });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/import", requireAuth, async (req, res, next) => {
  try {
    const modelUid = String(req.body?.modelUid || "").trim();
    let objectName = sanitizeObjectName(req.body?.objectName);

    if (!modelUid) {
      return res.status(400).json({ error: "modelUid is required" });
    }
    if (!objectName) {
      return res.status(400).json({ error: "A valid asset name is required" });
    }

    const uid = req.user.uid;
    if (await objectTypeExists(uid, objectName)) {
      return res.status(409).json({
        error: "An asset with this name already exists. Choose a different name.",
      });
    }

    const glbBuffer = await fetchModelGlbBuffer(modelUid);
    const path = `${uid}/${objectName}.glb`;
    const publicUrl = await uploadBuffer({
      bucket: "object-types",
      path,
      buffer: glbBuffer,
      contentType: "model/gltf-binary",
    });

    res.json({ publicUrl, path, objectName });
  } catch (error) {
    next(error);
  }
});

module.exports = { sketchfabRouter: router };
