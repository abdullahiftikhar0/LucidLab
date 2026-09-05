const express = require("express");
const admin = require("firebase-admin");
const { requireAuth } = require("../middleware/auth");
const { getFirestore } = require("../services/clients");

const router = express.Router();

function assertInstructor(userDoc, uid) {
  if (!userDoc.exists) {
    const err = new Error("User profile not found");
    err.status = 403;
    throw err;
  }
  const role = userDoc.get("role");
  const id = userDoc.id;
  if (id !== uid || !["instructor", "admin"].includes(role)) {
    const err = new Error("Instructor role required");
    err.status = 403;
    throw err;
  }
}

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const db = getFirestore();
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    res.json({ uid: req.user.uid, profile: userDoc.exists ? userDoc.data() : null });
  } catch (error) {
    next(error);
  }
});

router.post("/me/bootstrap", requireAuth, async (req, res, next) => {
  try {
    const db = getFirestore();
    const ref = db.collection("users").doc(req.user.uid);
    const payload = req.body || {};
    await ref.set(
      {
        uid: req.user.uid,
        email: req.user.email || payload.email || "",
        displayName: payload.displayName || req.user.name || "",
        role: payload.role || "student",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    const result = await ref.get();
    res.json({ profile: result.data() });
  } catch (error) {
    next(error);
  }
});

router.post("/firestore/query", requireAuth, async (req, res, next) => {
  try {
    const db = getFirestore();
    const { collection: collectionName, collectionPath, where = [], orderBy, limit } = req.body || {};
    const basePath = collectionPath || collectionName;
    let query = db.collection(basePath);
    for (const clause of where) {
      query = query.where(clause.field, clause.op || "==", clause.value);
    }
    if (orderBy?.field) {
      query = query.orderBy(orderBy.field, orderBy.direction || "asc");
    }
    if (limit) query = query.limit(Number(limit));
    const snap = await query.get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post("/firestore/get-doc", requireAuth, async (req, res, next) => {
  try {
    const db = getFirestore();
    const { path } = req.body || {};
    if (!path || typeof path !== "string") {
      return res.status(400).json({ error: "path is required" });
    }
    const snap = await db.doc(path).get();
    res.json({ exists: snap.exists, item: snap.exists ? { id: snap.id, ...snap.data() } : null });
  } catch (error) {
    next(error);
  }
});

router.post("/firestore/doc", requireAuth, async (req, res, next) => {
  try {
    const db = getFirestore();
    const { path, data, merge = true } = req.body || {};
    if (!path || typeof path !== "string") {
      return res.status(400).json({ error: "path is required" });
    }
    await db.doc(path).set(data || {}, { merge: Boolean(merge) });
    const doc = await db.doc(path).get();
    res.json({ item: doc.exists ? { id: doc.id, ...doc.data() } : null });
  } catch (error) {
    next(error);
  }
});

router.patch("/firestore/doc", requireAuth, async (req, res, next) => {
  try {
    const db = getFirestore();
    const { path, data } = req.body || {};
    if (!path || typeof path !== "string") return res.status(400).json({ error: "path is required" });
    await db.doc(path).update(data || {});
    const doc = await db.doc(path).get();
    res.json({ item: doc.exists ? { id: doc.id, ...doc.data() } : null });
  } catch (error) {
    next(error);
  }
});

router.delete("/firestore/doc", requireAuth, async (req, res, next) => {
  try {
    const db = getFirestore();
    const { path } = req.body || {};
    if (!path || typeof path !== "string") return res.status(400).json({ error: "path is required" });
    await db.doc(path).delete();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post("/classrooms", requireAuth, async (req, res, next) => {
  try {
    const db = getFirestore();
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    assertInstructor(userDoc, req.user.uid);
    const data = req.body || {};
    const ref = db.collection("classrooms").doc();
    await ref.set({
      ...data,
      instructorId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    res.json({ item: { id: doc.id, ...doc.data() } });
  } catch (error) {
    next(error);
  }
});

module.exports = { firestoreRouter: router };
