// Compare browser Origin against the incoming public Host. Next's request URL
// may use an internal hostname behind a reverse proxy. Never trust an arbitrary
// forwarded host for this check.
export function hasSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return ["http:", "https:"].includes(url.protocol) && url.host === headers.get("host");
  } catch {
    return false;
  }
}
