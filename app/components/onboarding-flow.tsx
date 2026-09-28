"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "./brand-logo";
import { agentRequest, Preference } from "../lib/agent-client";
import { localAccessToken } from "../lib/local-auth";

type Profile = { first_name?: string; last_name?: string; gender?: string; dob?: string };

export default function OnboardingFlow() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = localAccessToken();
      const response = await fetch("/api/profile", { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!response.ok) { if (!cancelled) router.replace("/login"); return; }
      const data = await response.json() as Profile;
      if (cancelled) return;
      setProfile({ ...data, dob: data.dob?.slice(0, 10) });
      if (data.first_name && data.last_name && data.gender && data.dob) {
        try {
          const result = await agentRequest<{ data: Preference | null }>("search-preference");
          router.replace(result.data ? "/" : "/ask");
          return;
        } catch { /* Profile can still be edited while the agent API recovers. */ }
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

  if (loading) return <main className="agent-shell flex min-h-screen items-center justify-center">Loading your profile…</main>;
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
