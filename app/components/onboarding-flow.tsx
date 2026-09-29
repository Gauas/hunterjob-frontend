"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "./brand-logo";
import PagePending from "./page-pending";
import { agentRequest, Preference } from "../lib/agent-client";
import { AccountProfile, AccountProfileError, getAccountProfile, hasCompletedProfile } from "../lib/entry-route";
import { localAccessToken } from "../lib/local-auth";

export default function OnboardingFlow() {
  const router = useRouter();
  const [profile, setProfile] = useState<AccountProfile>({});
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let data: AccountProfile;
      try {
        data = await getAccountProfile(localAccessToken());
      } catch (cause) {
        if (cancelled) return;
        if (cause instanceof AccountProfileError && [401, 403].includes(cause.status)) { router.replace("/login"); return; }
        setLoadError(cause instanceof Error ? cause.message : "Your profile is unavailable.");
        setLoading(false);
        return;
      }
      if (cancelled) return;
      setProfile({ ...data, dob: data.dob?.slice(0, 10) });
      if (hasCompletedProfile(data)) {
        try {
          const result = await agentRequest<{ data: Preference | null }>("search-preference");
          if (cancelled) return;
          router.replace(result.data ? "/" : "/ask");
          return;
        } catch (cause) {
          if (cancelled) return;
          setLoadError(cause instanceof Error ? cause.message : "Your job agent is unavailable.");
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [router]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile.first_name?.trim() || !profile.last_name?.trim() || !profile.gender || !profile.dob) { setError("Please complete every field."); return; }
    const parsed = new Date(profile.dob);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== profile.dob) { setError("Enter a valid date of birth."); return; }
    setPending(true); setError("");
    const token = localAccessToken();
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ first_name: profile.first_name.trim(), last_name: profile.last_name.trim(), gender: profile.gender, dob: profile.dob }),
      });
      if (!response.ok) throw new Error("We could not save your profile.");
      router.replace("/ask");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Please try again."); setPending(false); }
  }

  if (loading) return <PagePending />;
  if (loadError) return <main className="agent-shell min-h-screen px-5 py-10"><div className="mx-auto max-w-5xl"><BrandLogo/><section className="agent-card mt-10 max-w-2xl p-8 sm:p-12"><h1 className="text-2xl font-semibold">We could not open your profile</h1><p className="mt-3 text-[#777]">{loadError}</p><button className="agent-dark-button mt-7" onClick={() => window.location.reload()} type="button">Try again</button></section></div></main>;
  return (
    <main className="agent-shell min-h-screen px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl"><BrandLogo /></div>
      <section className="agent-card mx-auto mt-12 max-w-3xl p-8 sm:p-12">
        <p className="agent-eyebrow">GETTING STARTED</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Tell us a little about yourself</h1>
        <p className="mt-3 text-[#717171]">This helps make your HunterJob account yours.</p>
        <form className="mt-9 grid gap-6 sm:grid-cols-2" onSubmit={save}>
          <label className="agent-label">First name<input className="agent-input" autoComplete="given-name" onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} required value={profile.first_name ?? ""} /></label>
          <label className="agent-label">Last name<input className="agent-input" autoComplete="family-name" onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} required value={profile.last_name ?? ""} /></label>
          <label className="agent-label">Gender<select className="agent-input" onChange={(e) => setProfile({ ...profile, gender: e.target.value })} required value={profile.gender ?? ""}><option value="">Select an option</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>
          <label className="agent-label">Date of birth<input className="agent-input" max={new Date().toISOString().slice(0, 10)} onChange={(e) => setProfile({ ...profile, dob: e.target.value })} required type="date" value={profile.dob?.slice(0, 10) ?? ""} /></label>
          {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
          <button className="agent-dark-button sm:col-span-2" disabled={pending} type="submit">{pending ? "Saving…" : "Continue →"}</button>
        </form>
      </section>
    </main>
  );
}
