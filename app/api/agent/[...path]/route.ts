import { NextRequest, NextResponse } from "next/server";
import { accessTokenFromRequest, apiBaseUrl } from "../../../lib/gauas-auth";

export const runtime = "nodejs";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const token = accessTokenFromRequest(request);
  if (!token) return NextResponse.json({ error: "Authentication is required" }, { status: 401 });
  const { path } = await context.params;
  const allowed = ["dashboard", "search-preference", "matches", "connections"];
  if (!allowed.includes(path[0]) || path.some((segment) => segment === ".." || segment.includes("/"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 404 });
  }

  const targetPath = `/v1/hunterjob/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  try {
    const upstream = await fetch(`${apiBaseUrl()}${targetPath}`, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
