"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "../components/brand-logo";
import LogoutButton from "../components/logout-button";
import PagePending from "../components/page-pending";
import { localAccessToken } from "../lib/local-auth";
import { AccountProfile, AccountProfileError, getAccountProfile } from "../lib/entry-route";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      const token = localAccessToken();
      try {
        const result = await getAccountProfile(token);
        if (active) setProfile(result);
      } catch (cause) {
        if (!active) return;
        if (cause instanceof AccountProfileError && [401, 403].includes(cause.status)) { router.replace("/login"); return; }
        setError(cause instanceof Error ? cause.message : "Could not load your profile.");
      }
    }
    void load();
    return () => { active = false; };
  }, [router]);
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  const rows = [
    ["Full name", name],
    ["Email", profile?.email ?? profile?.identifier],
    ["Gender", profile?.gender ? profile.gender[0].toUpperCase() + profile.gender.slice(1) : ""],
    ["Date of birth", profile?.dob?.slice(0, 10)],
  ].filter(([, value]) => Boolean(value));
  if (!profile && !error) return <PagePending />;
  return <main className="agent-shell min-h-screen px-5 py-9"><div className="mx-auto max-w-4xl"><BrandLogo/><section className="agent-card mt-10 p-8 sm:p-12"><Link className="text-sm text-[#777]" href="/">← Dashboard</Link><h1 className="mt-5 text-3xl font-semibold">Your profile</h1>{error && <p className="mt-6 text-sm text-red-700">{error}</p>}{profile && <><div className="mt-8 flex items-center gap-5"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#181818] text-2xl font-semibold text-white">{(profile.first_name ?? "U")[0].toUpperCase()}</span><div><p className="text-xl font-semibold">{name || "HunterJob user"}</p><p className="text-sm text-[#777]">Personal information</p></div></div><dl className="mt-8 divide-y divide-[#eee] border-y border-[#eee]">{rows.map(([title, value]) => <div className="grid gap-1 py-5 sm:grid-cols-[180px_1fr]" key={title}><dt className="text-sm text-[#777]">{title}</dt><dd className="font-medium">{value}</dd></div>)}</dl><div className="mt-7 max-w-[180px]"><LogoutButton /></div></>}</section></div></main>;
}
