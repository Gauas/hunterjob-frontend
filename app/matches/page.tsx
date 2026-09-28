"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandLogo from "../components/brand-logo";
import JobCompanyMark from "../components/job-company-mark";
import { agentRequest, jobExperienceLabel, Match } from "../lib/agent-client";

export default function MatchesPage() {
  const [items, setItems] = useState<Match[]>([]);
  const [cursor, setCursor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(next = "") {
    setLoading(true);
    try {
      const result = await agentRequest<{ items: Match[]; next_cursor: string }>(`matches?limit=20${next ? `&cursor=${encodeURIComponent(next)}` : ""}`);
      setItems((current) => next ? [...current, ...result.items] : result.items);
      setCursor(result.next_cursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load matches");
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  return <main className="agent-shell min-h-screen px-5 py-9">
    <div className="mx-auto max-w-5xl">
      <BrandLogo />
      <section className="agent-card mt-10 p-8 sm:p-12">
        <Link className="text-sm text-[#777]" href="/">← Dashboard</Link>
        <h1 className="mt-5 text-3xl font-semibold">Recently added jobs</h1>
        <p className="mt-2 text-[#777]">Jobs matched to your preferences.</p>
        <div className="mt-8">
          {items.map((item) => <a className="job-row flex items-center gap-4 py-5" href={item.job.job_url} key={item.id} rel="noopener noreferrer" target="_blank">
            <JobCompanyMark name={item.job.company_name} logoURL={item.job.company_logo_url} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{item.job.title}</p>
              <p className="mt-1 truncate text-sm text-[#777]">{item.job.company_name}</p>
              <p className="mt-1 text-xs text-[#777] sm:hidden">{jobExperienceLabel(item.job)}</p>
            </div>
            <span className="hidden shrink-0 rounded-full bg-[#f3f3f3] px-3 py-1 text-xs sm:block">{jobExperienceLabel(item.job)}</span>
            <span aria-label="Open original job post">↗</span>
          </a>)}
          {!loading && !items.length && !error && <p className="py-12 text-center text-[#888]">No matches yet.</p>}
        </div>
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {cursor && <button className="agent-dark-button mt-6 w-full" disabled={loading} onClick={() => void load(cursor)} type="button">{loading ? "Loading…" : "Load more"}</button>}
      </section>
    </div>
  </main>;
}
