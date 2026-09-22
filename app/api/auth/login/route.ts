import { NextRequest, NextResponse } from "next/server";
import { callGauasAuth, LoginTokens, setAuthCookies } from "../../../lib/gauas-auth";

export async function POST(request: NextRequest) {
  const result = await callGauasAuth<LoginTokens>(request, "login");
  if (!result.ok) return result.response;

  if (!result.data.access_token || !result.data.refresh_token) {
    console.error("Gauas login response did not include the expected tokens");
    return NextResponse.json(
      { error: "We're having a little trouble right now. Please try again in a moment." },
      { headers: { "Cache-Control": "no-store" }, status: 502 },
    );
  }

  if (process.env.NODE_ENV === "development") {
    return NextResponse.json(
      { ok: true, tokens: result.data },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  setAuthCookies(response, result.data);
  return response;
}
