"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { LocalTokenPair, persistLocalSession } from "../lib/local-auth";

type AuthPageProps = {
  mode: "login" | "register";
};

function GoogleIcon() {
  return <Image alt="" aria-hidden="true" height={24} src="/assets/icons/google.svg" width={24} />;
}

function GitHubIcon() {
  return <Image alt="" aria-hidden="true" height={24} src="/assets/icons/github.svg" width={24} />;
}

function PasswordField({ isLogin }: { isLogin: boolean }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-base font-medium text-slate-900">
      Password
      <span className="relative mt-2 block">
        <input
          autoComplete={isLogin ? "current-password" : "new-password"}
          className="h-14 w-full rounded-2xl border border-white/70 bg-white/45 px-5 pr-14 text-base shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] outline-none backdrop-blur-md transition focus:border-white focus:bg-white/70 focus:ring-2 focus:ring-sky-200/70"
          maxLength={255}
          minLength={8}
          name="password"
          required
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/60 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            {visible ? <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></> : <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 8.5 4.6 9.5 8-0.4 1.3-1.2 2.8-2.4 4.1M6.2 6.2C4.3 7.7 3.1 10 2.5 12c1 3.4 4.5 8 9.5 8 1.4 0 2.7-.4 3.8-1" />}
          </svg>
        </button>
      </span>
    </label>
  );
}

export default function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const isLogin = mode === "login";
  const alternateHref = isLogin ? "/register" : "/login";
  const alternatePrompt = isLogin ? "Don't have an account?" : "Already have an account?";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(""), 2_000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setPending(true);

    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        tokens?: LocalTokenPair;
        verificationRequired?: boolean;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Authentication failed. Please try again.");
        return;
      }

      if (isLogin) {
        const tokens = payload?.tokens;

        if (process.env.NODE_ENV === "development" && tokens?.access_token && tokens.refresh_token) {
          persistLocalSession(tokens);
        }

        router.replace("/onboarding");
        router.refresh();
        return;
      }

      form.reset();
      router.replace(payload?.verificationRequired === false ? "/login" : "/verify");
    } catch {
      setError("We couldn't complete your request. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[url('/assets/images/auth-hero-sunrise.png')] bg-cover bg-center text-[#080d17]">
      {error && (
        <div
          aria-live="polite"
          className="auth-toast fixed left-4 right-4 top-4 z-50 ml-auto max-w-sm overflow-hidden rounded-2xl border border-white/30 bg-slate-950/90 px-5 py-4 text-sm text-white shadow-[0_18px_50px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:left-auto sm:right-6 sm:top-6"
          key={error}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-amber-400" />
            <p className="leading-6">{error}</p>
          </div>
          <span className="absolute bottom-0 right-0 h-1 w-full origin-right animate-[toast-progress_2s_linear_forwards] bg-amber-400" />
        </div>
      )}
      <div className="absolute inset-0 bg-white/10" />
      <div className="relative grid min-h-screen md:grid-cols-[1.15fr_0.85fr]">
        <section className="relative flex min-h-[48vh] flex-col px-7 py-12 sm:px-14 md:min-h-screen md:px-[12%] md:py-14">
          <div className="flex h-14 w-full items-center">
            <Image alt="HunterJob × Gauas" className="h-8 w-auto object-contain" height={144} priority src="/assets/branding/hunterjob-gauas-lockup-v2.png" width={1409} />
          </div>
          <div className="my-auto w-full max-w-lg -translate-y-5 pt-16 sm:-translate-y-8 md:-translate-y-20 md:pt-0 lg:-translate-y-24">
            <p className="mb-5 text-xs font-medium tracking-[0.17em] text-slate-500 sm:mb-7 sm:text-sm">OFFICIAL CAREER SOURCES</p>
            <h1 className="text-4xl font-bold leading-[1.12] tracking-[-0.045em] sm:text-5xl lg:text-6xl">Find work<br />worth building.</h1>
            <p className="mt-5 max-w-md text-lg leading-7 text-slate-600 sm:mt-7 sm:text-xl sm:leading-8">Opportunities from company career pages, all in one place.</p>
          </div>
        </section>

        <section className="flex min-h-[52vh] flex-col px-7 py-10 sm:px-14 md:min-h-screen md:px-12 md:py-14">
          <p className="ml-auto text-base text-slate-600">
          {alternatePrompt} <Link className="ml-5 font-medium text-slate-900 underline underline-offset-4" href={alternateHref}>{isLogin ? "Sign up" : "Sign in"}</Link>
          </p>
          <div className="relative isolate mx-auto my-auto w-full max-w-[510px] overflow-hidden rounded-[2rem] border border-white/70 bg-white/45 p-7 shadow-[0_28px_80px_rgba(15,23,42,0.2),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl sm:p-8 md:p-10">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <span className="absolute -left-20 -top-20 h-56 w-56 animate-[liquid-drift_12s_ease-in-out_infinite] rounded-full bg-sky-200/55 blur-3xl" />
              <span className="absolute -bottom-28 -right-20 h-64 w-64 animate-[liquid-drift_15s_ease-in-out_infinite_reverse] rounded-full bg-amber-100/70 blur-3xl" />
              <span className="absolute left-1/3 top-1/2 h-32 w-48 animate-[liquid-drift_10s_ease-in-out_infinite] rounded-full bg-white/70 blur-2xl" />
            </div>
            <div className="relative">
            <h2 className="text-5xl font-semibold tracking-[-0.045em]">{isLogin ? "Sign in" : "Create account"}</h2>
            <form aria-busy={pending} className="mt-6 space-y-5" method="post" onSubmit={handleSubmit}>
            <label className="block text-base font-medium text-slate-900">Email<input autoComplete="email" className="mt-2 h-14 w-full rounded-2xl border border-white/70 bg-white/45 px-5 text-base shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] outline-none backdrop-blur-md transition focus:border-white focus:bg-white/70 focus:ring-2 focus:ring-sky-200/70" maxLength={255} name="email" required type="email" /></label>
            <PasswordField isLogin={isLogin} />
            {isLogin && <Link className="-mt-2 block text-right text-base text-slate-500 underline underline-offset-4" href="#">Forgot password?</Link>}
            <button className="h-14 w-full rounded-full bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 text-base font-medium text-white shadow-[0_10px_24px_rgba(15,23,42,0.25),inset_0_1px_1px_rgba(255,255,255,0.22)] transition hover:scale-[1.01] hover:brightness-110 disabled:cursor-wait disabled:opacity-70" disabled={pending} type="submit">{pending ? "Please wait..." : isLogin ? "Sign in" : "Create account"} {!pending && <span className="ml-3">→</span>}</button>
            </form>
            <div className="my-5 flex items-center gap-5 text-center text-sm text-slate-500 before:h-px before:flex-1 before:bg-slate-300 after:h-px after:flex-1 after:bg-slate-300">OR</div>
            <div className="space-y-3">
              <button className="flex h-12 w-full items-center justify-center gap-5 rounded-full border border-white/80 bg-white/55 text-base font-medium shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-md transition hover:bg-white/80" type="button"><GoogleIcon />Continue with Google</button>
              <button className="flex h-12 w-full items-center justify-center gap-5 rounded-full border border-white/60 bg-white/30 text-base font-medium text-slate-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-md" disabled type="button"><GitHubIcon />Continue with GitHub</button>
            </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
