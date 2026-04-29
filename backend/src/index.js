const { env } = require("./config/env");
const { createApp } = require("./app");
const { initFirebaseAdmin } = require("./services/clients");

initFirebaseAdmin();
const app = createApp();

app.listen(env.port, () => {
  console.log(`[backend] listening on :${env.port}`);
});
