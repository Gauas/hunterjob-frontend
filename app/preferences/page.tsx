"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "../components/brand-logo";
import { agentRequest, Preference } from "../lib/agent-client";

function code(p: Preference) {
  if (p.experience.min_years === 0 && p.experience.max_years === 0) return "internship";
  if (p.experience.max_years === null) return "5+";
  return `${p.experience.min_years}-${p.experience.max_years}`;
}
export default function PreferencesPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("1-2");
  const [locations, setLocations] = useState("");
  const [keywords, setKeywords] = useState("");
  const [excluded, setExcluded] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { void agentRequest<{ data: Preference | null }>("search-preference").then(({ data }) => {
    if (!data) { router.replace("/ask"); return; }
    setRole(data.role); setExperience(code(data)); setLocations(data.locations.join(", ")); setKeywords(data.keywords.join(", ")); setExcluded(data.excluded_keywords.join(", "));
  }).catch(() => router.replace("/login")); }, [router]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await agentRequest("search-preference", { method: "PUT", body: JSON.stringify({ role, experience, locations: locations.split(",").map((s) => s.trim()).filter(Boolean), keywords: keywords.split(",").map((s) => s.trim()).filter(Boolean), excluded_keywords: excluded.split(",").map((s) => s.trim()).filter(Boolean), frequency: "daily" }) });
      router.replace("/");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save preferences"); setBusy(false); }
  }
  return <main className="agent-shell min-h-screen px-5 py-9"><div className="mx-auto max-w-4xl"><BrandLogo/><section className="agent-card mt-10 p-8 sm:p-12"><Link className="text-sm text-[#777]" href="/">← Dashboard</Link><h1 className="mt-5 text-3xl font-semibold">Search preferences</h1><p className="mt-2 text-[#777]">Tell your job agent what to look for.</p><form className="mt-8 grid gap-6" onSubmit={save}><label className="agent-label">Role<input className="agent-input" required value={role} onChange={(e) => setRole(e.target.value)}/></label><label className="agent-label">Experience<select className="agent-input" value={experience} onChange={(e) => setExperience(e.target.value)}>{["internship","fresher","0-1","1-2","2-3","3-5","5+"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="agent-label">Locations (comma separated)<input className="agent-input" required value={locations} onChange={(e) => setLocations(e.target.value)}/></label><label className="agent-label">Keywords (comma separated)<input className="agent-input" value={keywords} onChange={(e) => setKeywords(e.target.value)}/></label><label className="agent-label">Exclude keywords (comma separated)<input className="agent-input" value={excluded} onChange={(e) => setExcluded(e.target.value)}/></label><p className="text-sm text-[#777]">Delivery: Daily</p>{error && <p className="text-sm text-red-700">{error}</p>}<button className="agent-dark-button" disabled={busy} type="submit">{busy ? "Saving…" : "Save preferences"}</button></form></section></div></main>;
}
