import { NextResponse } from "next/server";
import { apiBaseUrl } from "../../../../lib/gauas-auth";

export async function GET() {
  try {
    const upstream = await fetch(`${apiBaseUrl()}/v1/auth/google/config`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) throw new Error("Google configuration unavailable");
    const payload = await upstream.json() as { client_id?: unknown };
    if (typeof payload.client_id !== "string" || !payload.client_id) throw new Error("Google client ID missing");
    return NextResponse.json({ client_id: payload.client_id }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: "Google sign-in is unavailable" }, { status: 502 });
  }
}
