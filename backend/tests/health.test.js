const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();
  try {
    await fn(port);
  } finally {
    server.close();
  }
}

test("GET /ping returns 204 with no body", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/ping`);
    const body = await response.text();
    assert.equal(response.status, 204);
    assert.equal(body, "");
  });
});

test("GET /api/health returns ok json", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.status, "ok");
  });
});
