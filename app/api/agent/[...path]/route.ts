import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { accessTokenFromRequest, accountServiceBaseUrl } from "../../../lib/gauas-auth";

const apiBaseUrl = (process.env.HUNTERJOB_API_BASE_URL ?? "https://api.gauas.com").replace(/\/+$/, "");
export const runtime = "nodejs";

function userID(profile: unknown): string {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return "";
  const values = profile as Record<string, unknown>;
  for (const key of ["user_key", "id", "user_id"]) {
    if (typeof values[key] === "string" && values[key]) return values[key];
  }
  for (const key of ["data", "user", "profile"]) {
    const nested = userID(values[key]);
    if (nested) return nested;
  }
  return "";
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const token = accessTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
  const secret = process.env.INTERNAL_AUTH_SECRET || process.env.HUNTERJOB_INTERNAL_AUTH_SECRET || "";
  if (secret.length < 32) return NextResponse.json({ error: "HunterJob authentication is not configured" }, { status: 503 });
  const { path } = await context.params;
  const allowed = ["dashboard", "search-preference", "matches", "connections"];
  if (!allowed.includes(path[0]) || path.some((segment) => segment === ".." || segment.includes("/"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 404 });
  }

  let accountResponse: Response;
  try {
    accountResponse = await fetch(`${accountServiceBaseUrl()}/v1/users/me`, {
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return NextResponse.json({ error: "Account Service is unavailable" }, { status: 502 });
  }
  if (accountResponse.status === 401 || accountResponse.status === 403) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  if (!accountResponse.ok) return NextResponse.json({ error: "Account Service is unavailable" }, { status: 502 });
  const identity = userID(await accountResponse.json().catch(() => null));
  if (!identity || /[\r\n]/.test(identity)) {
    return NextResponse.json({ error: "Account Service did not return a user ID" }, { status: 502 });
  }

  const targetPath = `/v1/hunterjob/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const message = `${request.method}\n${targetPath}\n${identity}\n${timestamp}`;
  const signature = createHmac("sha256", secret).update(message).digest("hex");
  try {
    const upstream = await fetch(`${apiBaseUrl}${targetPath}`, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        "X-Hunterjob-User": identity,
        "X-Hunterjob-Timestamp": timestamp,
        "X-Hunterjob-Signature": signature,
      },
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "Cache-Control": "no-store", "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "HunterJob is temporarily unavailable" }, { status: 502 });
  }
}

export const GET = proxy;
export const PUT = proxy;
export const POST = proxy;
export const PATCH = proxy;
