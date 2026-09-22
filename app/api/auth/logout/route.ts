import { NextRequest, NextResponse } from "next/server";
import { accessTokenFromRequest, clearAuthCookies, revokeGauasSession } from "../../../lib/gauas-auth";

export async function POST(request: NextRequest) {
  const accessToken = accessTokenFromRequest(request);

  await revokeGauasSession(accessToken);

  const response = new NextResponse(null, {
    headers: { "Cache-Control": "no-store" },
    status: 204,
  });
  clearAuthCookies(response);

  return response;
}
