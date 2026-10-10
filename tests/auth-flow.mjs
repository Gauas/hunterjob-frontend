// Tests the production BFF against an isolated identity/HunterJob HTTP fixture.
// No production account, credentials or signing key is used.
import assert from "node:assert/strict";
import { createAuthUpstream } from "./fixtures/auth-upstream.mjs";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const { server: upstream, state } = createAuthUpstream();
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
  state.accessToken = "expired";
  assert.equal((await fetch(`${base}/api/agent/dashboard`, { headers: { Cookie: cookies() } })).status, 401);
  const refresh = await fetch(`${base}/api/auth/refresh`, { method: "POST", headers: { Cookie: cookies() } });
  assert.equal(refresh.status, 200);
  keepCookies(refresh);
  assert.equal((await fetch(`${base}/api/agent/dashboard`, { headers: { Cookie: cookies() } })).status, 200);
  assert.equal((await fetch(`${base}/api/auth/google/config`)).status, 200);
  const googleRequest = (idToken, origin = base) => fetch(`${base}/api/auth/google`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ id_token: idToken }),
  });
  assert.equal((await googleRequest("")).status, 400);
  assert.equal((await googleRequest("invalid")).status, 401);
  assert.equal((await googleRequest("test-google-id-token", "https://untrusted.example")).status, 403);
  assert.equal((await googleRequest("test-google-id-token", "null")).status, 403);
  const googleLogin = await googleRequest("test-google-id-token");
  assert.equal(googleLogin.status, 200);
  assert.deepEqual(await googleLogin.json(), { ok: true });
  assert.ok(googleLogin.headers.getSetCookie().every((value) => /HttpOnly/i.test(value) && /Secure/i.test(value)));
  keepCookies(googleLogin);
  assert.equal((await fetch(`${base}/api/profile`, { headers: { Cookie: cookies() } })).status, 200);
  const logout = await fetch(`${base}/api/auth/logout`, { method: "POST", headers: { Cookie: cookies() } });
  assert.equal(logout.status, 204);
  assert.ok(state.loggedOut);
  keepCookies(logout);
  assert.equal(cookieJar.get("gauas_access_token"), "");
  console.log("PASS: login, profile/dashboard, refresh, Google ID-token exchange/cookies/rejections and logout");
} finally {
  if (app.exitCode === null) {
    const exited = once(app, "exit");
    app.kill("SIGTERM");
    await exited;
  }
  await new Promise((resolve) => upstream.close(resolve));
}
