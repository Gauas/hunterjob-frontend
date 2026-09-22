"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

function maskedEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "your email";
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(name.length - 2, 5)))}@${domain}`;
}

export default function VerificationPage({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    setPending(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        body: JSON.stringify({ code }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(payload?.error ?? "We couldn't verify that code. Please try again.");
        return;
      }

      router.replace("/login");
    } catch {
      setError("We couldn't complete your request. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[url('/assets/images/auth-hero-sunrise.png')] bg-cover bg-center text-[#080d17]">
      <div className="absolute inset-0 bg-white/10" />
      <div className="relative grid min-h-screen md:grid-cols-[1.15fr_0.85fr]">
        <section className="relative flex min-h-[42vh] flex-col px-7 py-12 sm:px-14 md:min-h-screen md:px-[12%] md:py-14">
          <div className="flex h-14 w-full items-center">
            <Image alt="HunterJob × Gauas" className="h-8 w-auto object-contain" height={144} priority src="/assets/branding/hunterjob-gauas-lockup-v2.png" width={1409} />
          </div>
          <div className="my-auto hidden w-full max-w-lg -translate-y-20 md:block lg:-translate-y-24">
            <p className="mb-7 text-sm font-medium tracking-[0.17em] text-slate-500">ONE LAST STEP</p>
            <h1 className="text-5xl font-bold leading-[1.12] tracking-[-0.045em] lg:text-6xl">Your next role<br />is waiting.</h1>
          </div>
        </section>

        <section className="flex min-h-[58vh] items-center px-7 py-10 sm:px-14 md:min-h-screen md:px-12 md:py-14">
          <div className="relative isolate mx-auto w-full max-w-[510px] overflow-hidden rounded-[2rem] border border-white/70 bg-white/45 p-7 shadow-[0_28px_80px_rgba(15,23,42,0.2),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl sm:p-10">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <span className="absolute -left-20 -top-20 h-56 w-56 animate-[liquid-drift_12s_ease-in-out_infinite] rounded-full bg-sky-200/55 blur-3xl" />
              <span className="absolute -bottom-28 -right-20 h-64 w-64 animate-[liquid-drift_15s_ease-in-out_infinite_reverse] rounded-full bg-amber-100/70 blur-3xl" />
            </div>
            <p className="text-sm font-semibold tracking-[0.14em] text-slate-500">EMAIL VERIFICATION</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Verify your own email</h2>
            <p className="mt-4 leading-7 text-slate-600">Enter the 6-digit code sent to <span className="font-medium text-slate-900">{maskedEmail(email)}</span>.</p>

            <form aria-busy={pending} className="mt-8" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="verification-code">Verification code</label>
              <input
                autoComplete="one-time-code"
                autoFocus
                className="h-20 w-full rounded-2xl border border-white/80 bg-white/55 px-5 text-center font-mono text-3xl font-semibold tracking-[0.55em] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] outline-none backdrop-blur-md transition focus:border-white focus:bg-white/75 focus:ring-2 focus:ring-sky-200/70"
                id="verification-code"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                pattern="[0-9]{6}"
                placeholder="••••••"
                required
                value={code}
              />
              {error && <p aria-live="polite" className="mt-4 text-sm leading-6 text-red-700" role="alert">{error}</p>}
              <button className="mt-6 h-14 w-full rounded-full bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 text-base font-medium text-white shadow-[0_10px_24px_rgba(15,23,42,0.25)] disabled:cursor-not-allowed disabled:opacity-50" disabled={pending || code.length !== 6} type="submit">{pending ? "Verifying..." : <>Verify email <span className="ml-3">→</span></>}</button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">Entered the wrong email? <Link className="font-medium text-slate-900 underline underline-offset-4" href="/register">Go back</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
