const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeSearchResult } = require("../src/services/sketchfab");

test("normalizeSearchResult maps sketchfab model fields", () => {
  const result = normalizeSearchResult({
    uid: "abc123",
    name: "Test Beaker",
    viewerUrl: "https://sketchfab.com/3d-models/test",
    thumbnails: {
      images: [{ url: "https://example.com/thumb.jpg", width: 200 }],
    },
    user: { displayName: "Author One" },
  });

  assert.equal(result.uid, "abc123");
  assert.equal(result.name, "Test Beaker");
  assert.equal(result.thumbnailUrl, "https://example.com/thumb.jpg");
  assert.equal(result.authorName, "Author One");
});

test("normalizeSearchResult returns null without uid", () => {
  assert.equal(normalizeSearchResult({ name: "No uid" }), null);
});
