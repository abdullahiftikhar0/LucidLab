const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");

test("health endpoint responds ok", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/healthz`);
  const data = await response.json();
  server.close();

  assert.equal(response.status, 200);
  assert.equal(data.ok, true);
});
