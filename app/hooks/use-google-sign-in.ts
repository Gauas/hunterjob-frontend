"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { exchangeGoogleCredential, googleClientID, googleIdentity, mountGoogleButton, type GoogleCredential } from "../lib/google-sign-in";
import type { LocalTokenPair } from "../lib/local-auth";

type Options = {
  onSuccess: (tokens?: LocalTokenPair) => Promise<void>;
  onError: (message: string) => void;
  onPending: (pending: boolean) => void;
};

export function useGoogleSignIn({ onSuccess, onError, onPending }: Options) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [clientID, setClientID] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]);
    void googleClientID(signal).then(setClientID).catch(() => {
      if (!controller.signal.aborted) setUnavailable(true);
    });
    return () => controller.abort();
  }, []);

  const signIn = useCallback(async ({ credential }: GoogleCredential) => {
    if (inFlight.current) return;
    inFlight.current = true;
    onPending(true);
    onError("");
    try {
      const tokens = await exchangeGoogleCredential(credential);
      await onSuccess(tokens);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      inFlight.current = false;
      onPending(false);
    }
  }, [onError, onPending, onSuccess]);

  useEffect(() => {
    const google = googleIdentity();
    if (!scriptReady || !clientID || !google || !buttonRef.current) return;
    google.initialize({ client_id: clientID, ux_mode: "popup", callback: signIn });
    return mountGoogleButton(google, buttonRef.current);
  }, [scriptReady, clientID, signIn]);

  return {
    buttonRef,
    preparing: !scriptReady || !clientID,
    unavailable,
    onScriptReady: () => setScriptReady(true),
    onScriptError: () => setUnavailable(true),
  };
}
