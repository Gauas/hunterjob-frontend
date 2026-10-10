import type { LocalTokenPair } from "./local-auth";

export type GoogleCredential = { credential: string };
export type GoogleIdentity = {
  initialize(options: { client_id: string; ux_mode: "popup"; callback: (response: GoogleCredential) => void }): void;
  renderButton(element: HTMLElement, options: { theme: string; size: string; shape: string; text: string; width: number; locale: string; logo_alignment: "center" | "left" }): void;
};

export function googleIdentity(): GoogleIdentity | undefined {
  return (window as Window & { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts?.id;
}

export async function googleClientID(signal: AbortSignal): Promise<string> {
  const response = await fetch("/api/auth/google/config", { cache: "no-store", signal });
  if (!response.ok) throw new Error("Google sign-in is unavailable right now.");
  const data = await response.json() as { client_id?: unknown };
  if (typeof data.client_id !== "string" || !data.client_id) throw new Error("Google client ID is missing.");
  return data.client_id;
}

export async function exchangeGoogleCredential(credential: string): Promise<LocalTokenPair | undefined> {
  if (!credential) throw new Error("Google did not return a credential. Please try again.");
  const response = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: credential }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => null) as { error?: string; tokens?: LocalTokenPair; ok?: boolean } | null;
  if (!response.ok || !data?.ok) throw new Error(data?.error ?? "Google sign-in failed. Please try again.");
  return data.tokens;
}

// Own the SDK-rendered element; never overlay a fake button on Google's iframe.
export function mountGoogleButton(google: GoogleIdentity, element: HTMLElement): () => void {
  let lastWidth = 0;
  const render = () => {
    const width = Math.min(400, Math.floor(element.getBoundingClientRect().width));
    if (width <= 0 || width === lastWidth) return;
    lastWidth = width;
    element.replaceChildren();
    google.renderButton(element, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width, locale: "en", logo_alignment: "center" });
  };
  render();
  const observer = new ResizeObserver(render);
  observer.observe(element);
  return () => { observer.disconnect(); element.replaceChildren(); };
}
