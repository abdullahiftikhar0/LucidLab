const express = require("express");
const { getSupabaseAdmin } = require("../services/clients");
const { uploadBase64 } = require("../services/storageUpload");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/avatar", requireAuth, async (req, res, next) => {
  try {
    const { fileDataUrl, fileName } = req.body || {};
    const uid = req.user.uid;
    const path = `avatars/${uid}_${Date.now()}_${fileName || "avatar.jpg"}`;
    const publicUrl = await uploadBase64({ bucket: "avatars", path, dataUrl: fileDataUrl });
    res.json({ publicUrl, path });
  } catch (error) {
    next(error);
  }
});

router.post("/classroom-cover", requireAuth, async (req, res, next) => {
  try {
    const { fileDataUrl, fileName, classroomId } = req.body || {};
    const path = `classrooms/${classroomId}/cover/${Date.now()}_${fileName || "cover.jpg"}`;
    const publicUrl = await uploadBase64({ bucket: "classroom-covers", path, dataUrl: fileDataUrl });
    res.json({ publicUrl, path });
  } catch (error) {
    next(error);
  }
});

router.post("/experiment-thumbnail", requireAuth, async (req, res, next) => {
  try {
    const { fileDataUrl, fileName, experimentId } = req.body || {};
    const path = `experiments/${experimentId}/thumbnail/${Date.now()}_${fileName || "thumbnail.jpg"}`;
    const publicUrl = await uploadBase64({ bucket: "experiment-thumbnails", path, dataUrl: fileDataUrl });
    res.json({ publicUrl, path });
  } catch (error) {
    next(error);
  }
});

router.post("/object-types", requireAuth, async (req, res, next) => {
  try {
    const { fileDataUrl, objectName } = req.body || {};
    const path = `${req.user.uid}/${objectName}.glb`;
    const publicUrl = await uploadBase64({ bucket: "object-types", path, dataUrl: fileDataUrl });
    res.json({ publicUrl, path });
  } catch (error) {
    next(error);
  }
});

router.get("/object-types", requireAuth, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const prefix = `${req.user.uid}/`;
    const { data, error } = await supabase.storage.from("object-types").list(prefix);
    if (error) throw new Error(error.message || "Failed to list object types");
    const items = (data || [])
      .filter((item) => item.name.toLowerCase().endsWith(".glb"))
      .map((item) => {
        const path = `${prefix}${item.name}`;
        return {
          id: item.name,
          name: item.name.replace(/\.glb$/i, ""),
          url: supabase.storage.from("object-types").getPublicUrl(path).data.publicUrl,
        };
      });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post("/markers", requireAuth, async (req, res, next) => {
  try {
    const { fileDataUrl, markerId } = req.body || {};
    const path = markerId || `marker_${Date.now()}`;
    const publicUrl = await uploadBase64({ bucket: "markers", path, dataUrl: fileDataUrl });
    res.json({ publicUrl, path });
  } catch (error) {
    next(error);
  }
});

router.get("/markers", requireAuth, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from("markers").list();
    if (error) throw new Error(error.message || "Failed to list markers");
    const items = (data || []).map((item) => ({
      id: item.name,
      name: item.name,
      imageUrl: supabase.storage.from("markers").getPublicUrl(item.name).data.publicUrl,
    }));
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.delete("/:bucket/*", requireAuth, async (req, res, next) => {
  try {
    const { bucket } = req.params;
    const rawPath = req.params[0];
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(bucket).remove([rawPath]);
    if (error) throw new Error(error.message || "Delete failed");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = { storageRouter: router };
