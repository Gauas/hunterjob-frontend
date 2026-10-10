"use client";

import Script from "next/script";
import { useGoogleSignIn } from "../hooks/use-google-sign-in";
import type { LocalTokenPair } from "../lib/local-auth";
import PendingDots from "./pending-dots";

type Props = {
  disabled: boolean;
  onSuccess: (tokens?: LocalTokenPair) => Promise<void>;
  onError: (message: string) => void;
  onPending: (pending: boolean) => void;
};

export default function GoogleSignInButton({ disabled, ...callbacks }: Props) {
  const { buttonRef, preparing, unavailable, onScriptReady, onScriptError } = useGoogleSignIn(callbacks);
  return <>
    <Script src="https://accounts.google.com/gsi/client?hl=en" strategy="afterInteractive" onReady={onScriptReady} onError={onScriptError} />
    <div className="relative min-h-10" aria-busy={disabled || preparing}>
      {preparing && !unavailable && <div className="absolute inset-0 flex h-10 items-center justify-center rounded-full border border-white/70 bg-white/50"><PendingDots label="Preparing Google sign-in" /></div>}
      <div className={disabled ? "pointer-events-none opacity-50" : ""} ref={buttonRef} inert={disabled} aria-label="Continue with Google" />
    </div>
    {unavailable && <p role="status" className="text-center text-xs text-slate-500">Google sign-in is unavailable. Please reload or sign in with email.</p>}
  </>;
}
