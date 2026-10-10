// Tests the production BFF against an isolated identity/HunterJob HTTP fixture.
// No production account, credentials or signing key is used.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

let expectedToken = "test-access-1";
let loggedOut = false;
const upstream = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  let body = "";
  for await (const chunk of req) body += chunk;
  if (req.url === "/v1/auth/login") {
    assert.equal(JSON.parse(body).identifier, "test@example.com");
    res.end(JSON.stringify({ access_token: expectedToken, refresh_token: "test-refresh-1" }));
  } else if (req.url === "/v1/auth/refresh") {
    assert.equal(JSON.parse(body).refresh_token, "test-refresh-1");
    expectedToken = "test-access-2";
    res.end(JSON.stringify({ access_token: expectedToken, refresh_token: "test-refresh-2" }));
  } else if (req.url === "/v1/auth/google/config") {
    res.end(JSON.stringify({ client_id: "public-test-client" }));
  } else if (req.headers.authorization !== `Bearer ${expectedToken}`) {
    res.writeHead(401).end(JSON.stringify({ error: "invalid token" }));
  } else if (req.url === "/v1/users/me") {
    res.end(JSON.stringify({ user_key: "test-user", first_name: "Test" }));
  } else if (req.url === "/v1/hunterjob/dashboard") {
    assert.equal(req.headers["x-gauas-user-key"], undefined);
    res.end(JSON.stringify({ search_preference: null, recent_jobs: [], connections: [] }));
  } else if (req.url === "/v1/auth/logout") {
    loggedOut = true;
    res.end("{}");
  } else res.writeHead(404).end("{}");
});
upstream.listen(0, "127.0.0.1");
await once(upstream, "listening");
const portProbe = createServer();
portProbe.listen(0, "127.0.0.1");
await once(portProbe, "listening");
const port = portProbe.address().port;
await new Promise((resolve) => portProbe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: { ...process.env, NODE_ENV: "production", API_BASE_URL: `http://127.0.0.1:${upstream.address().port}` },
  stdio: "ignore",
});
const cookieJar = new Map();
function keepCookies(response) {
  for (const value of response.headers.getSetCookie()) {
    const [pair] = value.split(";");
    const index = pair.indexOf("=");
    cookieJar.set(pair.slice(0, index), pair.slice(index + 1));
  }
}
const cookies = () => [...cookieJar].map(([key, value]) => `${key}=${value}`).join("; ");
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { ready = (await fetch(`${base}/login`)).ok; } catch { /* booting */ }
    if (ready) break;
    if (app.exitCode !== null) throw new Error("Next server exited before ready");
    await delay(250);
  }
  assert.ok(ready, "Next server must start");
  assert.equal((await fetch(`${base}/api/agent/dashboard`)).status, 401);
  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "test-password-only" }),
  });
  assert.equal(login.status, 200);
  assert.deepEqual(await login.json(), { ok: true }); // never expose tokens in production
  assert.ok(login.headers.getSetCookie().every((value) => /HttpOnly/i.test(value) && /Secure/i.test(value)));
  keepCookies(login);
  for (const path of ["profile", "agent/dashboard"]) {
    assert.equal((await fetch(`${base}/api/${path}`, { headers: { Cookie: cookies(), "X-Gauas-User-Key": "forged" } })).status, 200);
  }
  expectedToken = "expired";
  assert.equal((await fetch(`${base}/api/agent/dashboard`, { headers: { Cookie: cookies() } })).status, 401);
  const refresh = await fetch(`${base}/api/auth/refresh`, { method: "POST", headers: { Cookie: cookies() } });
  assert.equal(refresh.status, 200);
  keepCookies(refresh);
  assert.equal((await fetch(`${base}/api/agent/dashboard`, { headers: { Cookie: cookies() } })).status, 200);
  assert.equal((await fetch(`${base}/api/auth/google/config`)).status, 200);
  const logout = await fetch(`${base}/api/auth/logout`, { method: "POST", headers: { Cookie: cookies() } });
  assert.equal(logout.status, 204);
  assert.ok(loggedOut);
  keepCookies(logout);
  assert.equal(cookieJar.get("gauas_access_token"), "");
  console.log("PASS: HttpOnly login cookies, profile/dashboard Bearer forwarding, refresh rotation, Google config and logout");
} finally {
  app.kill("SIGTERM");
  await once(app, "exit");
  await new Promise((resolve) => upstream.close(resolve));
}
