"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearLocalSession, localAccessToken } from "../lib/local-auth";

type LogoutButtonProps = {
  onComplete?: () => void;
};

export default function LogoutButton({ onComplete }: LogoutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    const accessToken = localAccessToken();
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

    setPending(true);

    try {
      await fetch("/api/auth/logout", { headers, method: "POST" });
    } finally {
      clearLocalSession();
      onComplete?.();
      router.replace("/login");
      router.refresh();
      setPending(false);
    }
  }

  return (
    <button
      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      onClick={logout}
      type="button"
    >
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-8" />
      </svg>
      {pending ? "Logging out..." : "Log out"}
    </button>
  );
}
