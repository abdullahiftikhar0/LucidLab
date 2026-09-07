const JSZip = require("jszip");
const { env } = require("../config/env");

const SKETCHFAB_API = "https://api.sketchfab.com/v3";

function assertConfigured() {
  if (!env.sketchfabApiToken) {
    const err = new Error("Sketchfab API is not configured on the server");
    err.status = 503;
    throw err;
  }
}

function sketchfabHeaders() {
  return {
    Authorization: `Token ${env.sketchfabApiToken}`,
    Accept: "application/json",
  };
}

async function sketchfabFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${SKETCHFAB_API}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...sketchfabHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data?.detail || data?.error || `Sketchfab request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status === 404 ? 404 : response.status >= 400 && response.status < 500 ? 400 : 502;
    throw err;
  }
  return data;
}

function pickThumbnail(model) {
  const images = model?.thumbnails?.images;
  if (!Array.isArray(images) || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0]?.url || sorted[sorted.length - 1]?.url || null;
}

function normalizeSearchResult(model) {
  const uid = model?.uid;
  if (!uid) return null;
  return {
    uid,
    name: model.name || "Untitled model",
    thumbnailUrl: pickThumbnail(model),
    viewerUrl: model.viewerUrl || `https://sketchfab.com/3d-models/${uid}`,
    authorName: model.user?.displayName || model.user?.username || null,
  };
}

async function searchModels(query, { cursor, count = 24 } = {}) {
  assertConfigured();
  const params = new URLSearchParams({
    type: "models",
    q: query.trim(),
    downloadable: "1",
    count: String(Math.min(Math.max(count, 1), 24)),
  });
  if (cursor) params.set("cursor", cursor);

  const data = await sketchfabFetch(`/search?${params.toString()}`);
  const results = (data.results || [])
    .map(normalizeSearchResult)
    .filter(Boolean);

  return {
    results,
    nextCursor: data.cursors?.next || null,
  };
}

async function getDownloadInfo(uid) {
  assertConfigured();
  const data = await sketchfabFetch(`/models/${encodeURIComponent(uid)}/download`);
  const glbUrl = data?.glb?.url;
  const gltfUrl = data?.gltf?.url;
  const url = glbUrl || gltfUrl;
  if (!url) {
    const err = new Error("This model is not available for download");
    err.status = 400;
    throw err;
  }
  return { url, format: glbUrl ? "glb" : "gltf" };
}

async function extractGlbFromZip(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const glbEntry = Object.values(zip.files).find(
    (f) => !f.dir && f.name.toLowerCase().endsWith(".glb"),
  );
  if (glbEntry) {
    return glbEntry.async("nodebuffer");
  }
  const err = new Error("Downloaded archive does not contain a GLB file");
  err.status = 400;
  throw err;
}

async function fetchModelGlbBuffer(uid) {
  const { url, format } = await getDownloadInfo(uid);
  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error("Failed to download model from Sketchfab");
    err.status = 502;
    throw err;
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  const isZip =
    format === "gltf" ||
    buffer[0] === 0x50 && buffer[1] === 0x4b; // PK zip signature

  if (isZip) {
    return extractGlbFromZip(buffer);
  }
  return buffer;
}

module.exports = {
  searchModels,
  fetchModelGlbBuffer,
  normalizeSearchResult,
};
