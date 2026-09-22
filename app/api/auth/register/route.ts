import { NextRequest, NextResponse } from "next/server";
import { callGauasAuth, RegistrationResult, setVerificationCookies } from "../../../lib/gauas-auth";

export async function POST(request: NextRequest) {
  const requestBody = request.clone();
  const result = await callGauasAuth<RegistrationResult>(request, "register");
  if (!result.ok) return result.response;

  const response = NextResponse.json(
    {
      ok: true,
      verificationRequired: result.data.verification_required,
    },
    { headers: { "Cache-Control": "no-store" }, status: 201 },
  );
  if (result.data.verification_required) {
    const input = await requestBody.json().catch(() => null) as { email?: unknown } | null;
    const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json(
        { error: "We're having a little trouble right now. Please try again in a moment." },
        { headers: { "Cache-Control": "no-store" }, status: 502 },
      );
    }
    setVerificationCookies(response, email);
  }

  return response;
}
