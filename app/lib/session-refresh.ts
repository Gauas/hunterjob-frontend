let pendingRefresh: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (!pendingRefresh) {
    pendingRefresh = fetch("/api/auth/refresh", { method: "POST", cache: "no-store" })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => { pendingRefresh = null; });
  }
  return pendingRefresh;
}
