"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { agentRequest, Connection, Dashboard, experienceLabel, jobExperienceLabel, Match } from "./lib/agent-client";
import { localAccessToken } from "./lib/local-auth";
import LogoutButton from "./components/logout-button";
import JobCompanyMark from "./components/job-company-mark";
import BrandLogo from "./components/brand-logo";
import PagePending from "./components/page-pending";
import { useEntrySession } from "./components/entry-session";
import { AccountProfileError, getAccountProfile, hasCompletedProfile } from "./lib/entry-route";

const channelIcons: Record<string, string> = { telegram: "➤", discord: "◕", zalo: "Z", messenger: "ϟ", whatsapp: "◉", email: "✉" };
const channels = ["telegram", "discord", "zalo", "messenger", "whatsapp", "email"];
function label(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
function SmallIcon({ kind }: { kind: string }) {
  const paths: Record<string, React.ReactNode> = {
    role: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/></>,
    experience: <><path d="M5 20v-5M10 20V9M15 20V4M20 20v-9"/></>,
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></>,
    keywords: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    delivery: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  };
  return <span className="detail-icon"><svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">{paths[kind]}</svg></span>;
}
function PreferenceDetail({ kind, title, value }: { kind: string; title: string; value: string }) {
  return <div className="flex min-w-0 items-center gap-4"><SmallIcon kind={kind}/><div className="min-w-0"><p className="text-sm text-[#777]">{title}</p><p className="truncate text-[17px] font-semibold text-[#171717]">{value}</p></div></div>;
}
function JobRow({ match }: { match: Match }) {
  return <a className="job-row group flex items-center gap-4 py-4" href={match.job.job_url} rel="noopener noreferrer" target="_blank">
    <JobCompanyMark name={match.job.company_name} logoURL={match.job.company_logo_url} />
    <div className="min-w-0 flex-1"><p className="truncate font-semibold text-[#171717]">{match.job.title}</p><p className="truncate text-sm text-[#777]">{match.job.company_name}</p><p className="text-xs text-[#777] sm:hidden">{jobExperienceLabel(match.job)}</p></div>
    <span className="hidden rounded-full bg-[#f3f3f3] px-3 py-1 text-xs text-[#555] sm:block">{jobExperienceLabel(match.job)}</span>
    <span className="text-xl transition group-hover:translate-x-1" aria-label="Open original job post">↗</span>
  </a>;
}

export default function Home() {
  const router = useRouter();
  const { snapshot } = useEntrySession();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [name, setName] = useState("Profile");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const profile = await getAccountProfile(localAccessToken());
        if (!active) return;
        if (!hasCompletedProfile(profile)) { router.replace("/onboarding"); return; }
        setName(profile.first_name ?? "Profile");
        const data = await agentRequest<Dashboard>("dashboard");
        if (!active) return;
        if (!data.search_preference) { router.replace("/ask"); return; }
        setDashboard(data);
      } catch (cause) {
        if (!active) return;
        if (cause instanceof AccountProfileError && [401, 403].includes(cause.status)) { router.replace("/login"); return; }
        setError(cause instanceof Error ? cause.message : "Dashboard unavailable");
      }
    }
    void load();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    const updateConnections = () => {
      void agentRequest<{ items: Connection[] }>("connections").then((result) => {
        setDashboard((current) => {
          const previous = current ?? snapshot?.dashboard;
          return previous ? { ...previous, connections: result.items } : null;
        });
      }).catch(() => { /* The dashboard will show the last known connection state. */ });
    };
    window.addEventListener("focus", updateConnections);
    return () => window.removeEventListener("focus", updateConnections);
  }, [snapshot]);

  async function act(connection: Connection) {
    if (!connection.available) return;
    setBusy(connection.provider); setError("");
    try {
      if (!connection.connected) {
        const result = await agentRequest<{ connection_url: string }>(`connections/${connection.provider}/connect`, { method: "POST" });
        if (result.connection_url) window.location.assign(result.connection_url);
      } else {
        const enabled = !connection.enabled;
        await agentRequest(`connections/${connection.provider}`, { method: "PATCH", body: JSON.stringify({ enabled }) });
        setDashboard((current) => {
          const previous = current ?? snapshot?.dashboard;
          return previous ? { ...previous, connections: previous.connections.map((item) => item.provider === connection.provider ? { ...item, enabled } : item) } : null;
        });
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update connection"); }
    finally { setBusy(""); }
  }
  async function refreshConnections() {
    try {
      const result = await agentRequest<{ items: Connection[] }>("connections");
      setDashboard((current) => {
        const previous = current ?? snapshot?.dashboard;
        return previous ? { ...previous, connections: result.items } : null;
      });
    } catch { /* Keep the last known state. */ }
  }

  if (!dashboard && !snapshot && error) return <main className="agent-shell min-h-screen px-5 py-9"><div className="mx-auto max-w-5xl"><BrandLogo/><section className="agent-card mt-10 max-w-2xl p-8 sm:p-12"><h1 className="text-2xl font-semibold">We could not open your dashboard</h1><p className="mt-3 text-[#777]">{error}</p><button className="agent-dark-button mt-7" onClick={() => window.location.reload()} type="button">Try again</button></section></div></main>;
  if (!dashboard && !snapshot) return <PagePending />;
  const visibleDashboard = dashboard ?? snapshot!.dashboard;
  const visibleName = name === "Profile" ? snapshot?.firstName ?? name : name;
  const pref = visibleDashboard.search_preference!;
  return <main className="agent-shell min-h-screen px-4 py-7 text-[#171717] sm:px-7 sm:py-12">
    <div className="mx-auto max-w-[1390px]">
      <header className="agent-card flex min-h-[88px] items-center justify-between px-6 sm:px-11"><Link href="/" aria-label="HunterJob home"><Image alt="HunterJob" src="/assets/branding/hunterjob-wordmark.png" width={1359} height={264} className="h-auto w-[150px] object-contain" priority /></Link><details className="relative"><summary className="flex cursor-pointer list-none items-center gap-3 rounded-full border border-[#efefef] px-3 py-2 text-sm"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#171717] font-semibold text-white">{visibleName.slice(0,1).toUpperCase()}</span>{visibleName}<span>⌄</span></summary><div className="absolute right-0 z-20 mt-2 w-40 rounded-2xl border bg-white p-2 shadow-xl"><Link className="block rounded-lg px-4 py-3 text-sm font-medium hover:bg-slate-50" href="/profile">Profile</Link><div className="mx-3 border-t border-slate-100"/><LogoutButton /></div></details></header>
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(330px,1fr)]">
        <div className="flex flex-col gap-4">
          <section className="agent-card p-7 sm:p-9"><div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-semibold tracking-tight">Search preferences</h1><Link className="rounded-full border border-[#e8e8e8] px-5 py-2 text-sm transition hover:bg-[#f7f7f7]" href="/preferences">✎ &nbsp; Edit</Link></div><div className="mt-9 grid gap-8 sm:grid-cols-3"><PreferenceDetail kind="role" title="Role" value={pref.role}/><PreferenceDetail kind="experience" title="Experience" value={experienceLabel(pref.experience)}/><PreferenceDetail kind="location" title="Location" value={pref.locations.join(", ")}/></div><div className="mt-8 grid gap-8 sm:grid-cols-2"><PreferenceDetail kind="keywords" title="Keywords" value={pref.keywords.join(", ") || "Any"}/><PreferenceDetail kind="delivery" title="Delivery" value="Daily"/></div></section>
          <section className="agent-card flex-1 p-7 sm:p-9"><div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-semibold tracking-tight">Recently added jobs</h2><Link className="text-sm transition hover:translate-x-1" href="/matches">View all &nbsp; →</Link></div><div className="mt-5">{visibleDashboard.recent_jobs.length ? visibleDashboard.recent_jobs.map((item) => <JobRow key={item.id} match={item}/>) : <p className="py-12 text-center text-[#888]">Your matches will appear here as new jobs arrive.</p>}</div></section>
        </div>
        <section className="agent-card p-7 sm:p-9"><h2 className="text-2xl font-semibold tracking-tight">Chat delivery</h2><p className="mt-2 text-[#777]">Get new jobs delivered to your favorite apps</p><div className="mt-7">{channels.map((provider) => { const connection = visibleDashboard.connections.find((item) => item.provider === provider) ?? { provider, available: false, connected: false, enabled: false }; return <div className="channel-row flex items-center gap-5 py-5" key={provider}><span className="channel-icon">{channelIcons[provider]}</span><div className="min-w-0 flex-1"><p className="font-semibold">{label(provider)}</p><p className="mt-1 text-sm text-[#858585]">● &nbsp;{connection.connected ? "Connected" : connection.available ? "Not connected" : "Coming soon"}</p></div><button aria-label={`${connection.connected ? connection.enabled ? "Pause" : "Enable" : "Connect"} ${provider}`} aria-pressed={connection.connected ? connection.enabled : undefined} className={connection.connected ? `channel-toggle ${connection.enabled ? "on" : ""}` : "rounded-2xl border border-[#eee] px-5 py-3 text-sm disabled:cursor-not-allowed disabled:text-[#aaa]"} disabled={!connection.available || busy === provider} onClick={() => void act(connection)} type="button">{connection.connected ? <span/> : "Connect"}</button></div>; })}</div><button className="mt-5 text-xs text-[#999] underline underline-offset-4" onClick={() => void refreshConnections()} type="button">Refresh connection status</button>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}</section>
      </div>
    </div>
  </main>;
}
