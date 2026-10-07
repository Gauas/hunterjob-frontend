import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, revokeGauasSession } from "../../../lib/gauas-auth";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("gauas_access_token")?.value ?? "";
  const refreshToken = request.cookies.get("gauas_refresh_token")?.value ?? "";

  if (!await revokeGauasSession(accessToken, refreshToken)) {
    return NextResponse.json({ error: "Could not end your session. Please try again." }, { status: 502 });
  }

  const response = new NextResponse(null, {
    headers: { "Cache-Control": "no-store" },
    status: 204,
  });
  clearAuthCookies(response);

  return response;
}
