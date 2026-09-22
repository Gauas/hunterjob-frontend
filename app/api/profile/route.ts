import { NextRequest, NextResponse } from "next/server";
import { accessTokenFromRequest, accountServiceBaseUrl } from "../../lib/gauas-auth";

const REQUEST_TIMEOUT_MS = 10_000;

async function proxyProfile(request: NextRequest, method: "GET" | "PATCH") {
  const accessToken = accessTokenFromRequest(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: "Authentication is required" },
      { headers: { "Cache-Control": "no-store" }, status: 401 },
    );
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  });
  const body = method === "PATCH" ? await request.text() : undefined;

  if (body) headers.set("Content-Type", "application/json");

  let upstream: Response;
  try {
    upstream = await fetch(`${accountServiceBaseUrl()}/v1/users/me`, {
      body,
      cache: "no-store",
      headers,
      method,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json(
      { error: "Profile service is unavailable" },
      { headers: { "Cache-Control": "no-store" }, status: 502 },
    );
  }

  const responseBody = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";

  return new NextResponse(responseBody, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": contentType,
    },
    status: upstream.status,
  });
}

export async function GET(request: NextRequest) {
  return proxyProfile(request, "GET");
}

export async function PATCH(request: NextRequest) {
  return proxyProfile(request, "PATCH");
}
