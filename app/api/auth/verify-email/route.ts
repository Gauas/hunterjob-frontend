import { NextRequest, NextResponse } from "next/server";
import { clearVerificationCookies, verifyGauasEmail } from "../../../lib/gauas-auth";

export async function POST(request: NextRequest) {
  const result = await verifyGauasEmail(request);
  if (!result.ok) return result.response;

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  clearVerificationCookies(response);
  return response;
}
