import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "../../../lib/hunterjob-api";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null) as { query?: unknown } | null;
  const query = typeof payload?.query === "string" ? payload.query.trim() : "";
  if (!query) return NextResponse.json({ error: "Search query is required." }, { status: 400 });

  try {
    const response = await fetch(`${apiBaseUrl()}/api/v1/search/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      cache: "no-store",
      signal: AbortSignal.timeout(300_000),
    });
    const body = await response.json().catch(() => ({ error: "HunterJob returned an invalid response." }));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "AI search is temporarily unavailable." }, { status: 503 });
  }
}
