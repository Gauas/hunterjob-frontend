import assert from "node:assert/strict";
import { createServer } from "node:http";

// Isolated test doubles only. Production Google signature verification belongs
// to identity-service; this fixture tests the frontend's HTTP/cookie contract.
export function createAuthUpstream() {
  const state = { accessToken: "test-access-1", loggedOut: false };
  const tokens = (refresh = "test-refresh-2") => ({ access_token: state.accessToken, refresh_token: refresh });
  const json = (res, status, body) => res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(body));
  const protectedRoute = (handler) => (req, res, body) => {
    if (req.headers.authorization !== `Bearer ${state.accessToken}`) return json(res, 401, { error: "invalid token" });
    return handler(req, res, body);
  };

  function login(_req, res, body) {
    assert.equal(body.identifier, "test@example.com");
    return json(res, 200, tokens("test-refresh-1"));
  }
  function refresh(_req, res, body) {
    assert.equal(body.refresh_token, "test-refresh-1");
    state.accessToken = "test-access-2";
    return json(res, 200, tokens());
  }
  function googleLogin(_req, res, body) {
    if (body.id_token !== "test-google-id-token") return json(res, 401, { error: "invalid google token" });
    return json(res, 200, tokens());
  }
  function dashboard(req, res) {
    assert.equal(req.headers["x-gauas-user-key"], undefined);
    return json(res, 200, { search_preference: null, recent_jobs: [], connections: [] });
  }
  function logout(_req, res) {
    state.loggedOut = true;
    return json(res, 200, {});
  }

  const routes = new Map([
    ["POST /v1/auth/login", login],
    ["POST /v1/auth/refresh", refresh],
    ["POST /v1/auth/google", googleLogin],
    ["GET /v1/auth/google/config", (_req, res) => json(res, 200, { client_id: "public-test-client" })],
    ["GET /v1/users/me", protectedRoute((_req, res) => json(res, 200, { user_key: "test-user", first_name: "Test" }))],
    ["GET /v1/hunterjob/dashboard", protectedRoute(dashboard)],
    ["POST /v1/auth/logout", protectedRoute(logout)],
  ]);
  const server = createServer(async (req, res) => {
    const handler = routes.get(`${req.method} ${req.url}`);
    if (!handler) return json(res, 404, {});
    let raw = "";
    for await (const chunk of req) raw += chunk;
    return handler(req, res, raw ? JSON.parse(raw) : {});
  });
  return { server, state };
}
