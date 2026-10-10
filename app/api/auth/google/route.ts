import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, LoginTokens, setAuthCookies } from "../../../lib/gauas-auth";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as { id_token?: unknown } | null;
  const idToken = typeof body?.id_token === "string" ? body.id_token.trim() : "";
  if (!idToken || idToken.length > 8192) {
    return NextResponse.json({ error: "Google ID token is required" }, { status: 400 });
  }
  try {
    const upstream = await fetch(`${apiBaseUrl()}/v1/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: upstream.status === 429 ? "Too many attempts. Try again later." : "Google sign-in failed" }, {
        status: upstream.status === 429 ? 429 : upstream.status >= 500 ? 502 : 401,
        headers: { "Cache-Control": "no-store" },
      });
    }
    const tokens = await upstream.json() as LoginTokens;
    if (!tokens.access_token || !tokens.refresh_token) throw new Error("Incomplete token pair");
    const response = NextResponse.json(
      process.env.NODE_ENV === "development" ? { ok: true, tokens } : { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    setAuthCookies(response, tokens);
    return response;
  } catch {
    return NextResponse.json({ error: "Google sign-in is unavailable" }, { status: 502 });
  }
}
