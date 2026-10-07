import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, LoginTokens, setAuthCookies } from "../../../lib/gauas-auth";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("gauas_refresh_token")?.value;
  if (!refreshToken) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  try {
    const upstream = await fetch(`${apiBaseUrl()}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Session expired" }, { status: upstream.status < 500 ? 401 : 502 });
    }
    const tokens = await upstream.json() as LoginTokens;
    if (!tokens.access_token || !tokens.refresh_token) throw new Error("Incomplete token pair");
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    setAuthCookies(response, tokens);
    return response;
  } catch {
    return NextResponse.json({ error: "Identity service unavailable" }, { status: 502 });
  }
}
