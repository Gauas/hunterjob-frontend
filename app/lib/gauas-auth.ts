import "server-only";

import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_BASE_URL = "https://api.gauas.com";
const REQUEST_TIMEOUT_MS = 10_000;
const VERIFICATION_COOKIE_MAX_AGE_SECONDS = 15 * 60;

export type AuthAction = "login" | "register";

export type LoginTokens = {
  access_token: string;
  refresh_token: string;
};

export type RegistrationResult = {
  user_key: string;
  verification_required: boolean;
};

type VerificationResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

type AuthResult<T> =
  | { data: T; ok: true }
  | { ok: false; response: NextResponse };

function apiBaseUrl() {
  return (process.env.GAUAS_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

export function accountServiceBaseUrl() {
  return (process.env.ACCOUNT_SERVICE_BASE_URL ?? apiBaseUrl()).replace(/\/+$/, "");
}

export function accessTokenFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme === "Bearer" && token) return token;

  return request.cookies.get("gauas_access_token")?.value ?? "";
}

function cookieDomain() {
  if (process.env.NODE_ENV !== "production") return undefined;
  return process.env.GAUAS_COOKIE_DOMAIN ?? ".gauas.com";
}

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { headers: { "Cache-Control": "no-store" }, status },
  );
}

function publicAuthError(action: AuthAction, status: number) {
  if (status === 401) {
    return action === "login"
      ? "The email or password is incorrect."
      : "We couldn't create your account with those details.";
  }
  if (status === 409) return "An account with this email already exists.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status >= 500) return "We're having a little trouble right now. Please try again in a moment.";
  return "Please check your details and try again.";
}

export async function callGauasAuth<T>(
  request: NextRequest,
  action: AuthAction,
): Promise<AuthResult<T>> {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return { ok: false, response: errorResponse("Invalid request body", 400) };
  }

  const body = input as Record<string, unknown>;
  const identifier = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) || identifier.length > 255) {
    return { ok: false, response: errorResponse("A valid email is required", 400) };
  }
  if (password.length < 8 || password.length > 255) {
    return {
      ok: false,
      response: errorResponse("Password must be between 8 and 255 characters", 400),
    };
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });
  if (forwardedFor) headers.set("X-Forwarded-For", forwardedFor);

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBaseUrl()}/v1/auth/${action}`, {
      body: JSON.stringify({ identifier, password, type: "email" }),
      cache: "no-store",
      headers,
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return {
      ok: false,
      response: errorResponse("We're having a little trouble right now. Please try again in a moment.", 502),
    };
  }

  const payload = (await upstream.json().catch(() => null)) as
    | ({ error?: unknown } & Record<string, unknown>)
    | null;

  if (!upstream.ok) {
    if (upstream.status >= 500) {
      console.error("Gauas authentication request failed", {
        action,
        error: typeof payload?.error === "string" ? payload.error : "unknown upstream error",
        status: upstream.status,
      });
    }
    return {
      ok: false,
      response: errorResponse(publicAuthError(action, upstream.status), upstream.status),
    };
  }

  return { data: payload as T, ok: true };
}

export async function verifyGauasEmail(request: NextRequest): Promise<VerificationResult> {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return { ok: false, response: errorResponse("Invalid request body", 400) };
  }

  const body = input as Record<string, unknown>;
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const identifier = request.cookies.get("gauas_verification_email")?.value?.trim().toLowerCase() ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) || identifier.length > 255) {
    return { ok: false, response: errorResponse("Your verification session has expired. Please create your account again.", 400) };
  }
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, response: errorResponse("Enter the 6-digit verification code", 400) };
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });
  if (forwardedFor) headers.set("X-Forwarded-For", forwardedFor);

  let upstream: Response;
  try {
    upstream = await fetch(`${accountServiceBaseUrl()}/v1/auth/verify`, {
      body: JSON.stringify({ identifier, code }),
      cache: "no-store",
      headers,
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return {
      ok: false,
      response: errorResponse("We're having a little trouble right now. Please try again in a moment.", 502),
    };
  }

  if (upstream.ok) return { ok: true };

  const payload = (await upstream.json().catch(() => null)) as { error?: unknown } | null;
  if (upstream.status >= 500) {
    console.error("Gauas email verification request failed", {
      error: typeof payload?.error === "string" ? payload.error : "unknown upstream error",
      status: upstream.status,
    });
  }

  const error = upstream.status === 400 || upstream.status === 401 || upstream.status === 404
    ? "That verification code is invalid or has expired."
    : upstream.status === 429
      ? "Too many attempts. Please wait a moment and try again."
      : "We're having a little trouble right now. Please try again in a moment.";

  return { ok: false, response: errorResponse(error, upstream.status) };
}

export function setAuthCookies(response: NextResponse, tokens: LoginTokens) {
  const secure = process.env.NODE_ENV === "production";
  const domain = cookieDomain();

  response.cookies.set("gauas_access_token", tokens.access_token, {
    domain,
    httpOnly: true,
    maxAge: 15 * 60,
    path: "/",
    sameSite: "lax",
    secure,
  });
  response.cookies.set("gauas_refresh_token", tokens.refresh_token, {
    domain,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60,
    path: "/api/auth",
    sameSite: "lax",
    secure,
  });
}

export async function revokeGauasSession(accessToken: string) {
  if (!accessToken) return;

  try {
    await fetch(`${accountServiceBaseUrl()}/v1/auth/logout`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    console.error("Gauas logout request failed");
  }
}

export function clearAuthCookies(response: NextResponse) {
  const domain = cookieDomain();

  response.cookies.set("gauas_access_token", "", { domain, maxAge: 0, path: "/" });
  response.cookies.set("gauas_refresh_token", "", { domain, maxAge: 0, path: "/api/auth" });
}

export function setVerificationCookies(response: NextResponse, email: string) {
  const secure = process.env.NODE_ENV === "production";
  const domain = cookieDomain();
  const options = {
    domain,
    httpOnly: true,
    maxAge: VERIFICATION_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure,
  };

  response.cookies.set("gauas_verification_email", email, options);
}

export function clearVerificationCookies(response: NextResponse) {
  const domain = cookieDomain();
  response.cookies.set("gauas_verification_email", "", { domain, maxAge: 0, path: "/" });
  response.cookies.set("gauas_verification_user_key", "", { domain, maxAge: 0, path: "/" });
}
