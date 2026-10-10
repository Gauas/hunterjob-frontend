import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl, clearAuthCookies, setVerificationCookies } from "./gauas-auth";

// Only called after identity-service confirms the password and returns its
// explicit verification_required code. Never infer this state from a generic 401.
export async function beginEmailVerification(request: NextRequest, identifier: string) {
  const headers = new Headers({ "Content-Type": "application/json" });
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers.set("X-Forwarded-For", forwardedFor);

  try {
    const upstream = await fetch(`${apiBaseUrl()}/v1/auth/resend-verification`, {
      method: "POST",
      headers,
      body: JSON.stringify({ identifier }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (upstream.status === 429) return verificationError("Too many verification requests. Please wait before trying again.", 429);
    if (!upstream.ok) return verificationError("We couldn't send a new code. Please try signing in again.", 502);

    const response = NextResponse.json({ ok: true, verificationRequired: true }, { headers: { "Cache-Control": "no-store" } });
    clearAuthCookies(response);
    setVerificationCookies(response, identifier);
    return response;
  } catch {
    return verificationError("The verification service is unavailable. Please try again.", 502);
  }
}

function verificationError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}
