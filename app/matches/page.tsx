"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BrandLogo from "../components/brand-logo";
import JobCompanyMark from "../components/job-company-mark";
import PendingDots from "../components/pending-dots";
import { agentRequest, jobExperienceLabel, Match } from "../lib/agent-client";

export default function MatchesPage() {
  const [items, setItems] = useState<Match[]>([]);
  const [cursor, setCursor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const request = useRef<AbortController | null>(null);

  async function load(next = "") {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ limit: "20" });
      if (next) query.set("cursor", next);
      const result = await agentRequest<{ items: Match[]; next_cursor: string }>(
        `matches?${query}`, { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      setItems((current) => next ? [...current, ...result.items] : result.items);
      setCursor(result.next_cursor);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "Could not load matches");
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    // Defer to a microtask so React's development remount can cancel before fetching.
    let active = true;
    queueMicrotask(() => { if (active) void load(); });
    return () => {
      active = false;
      request.current?.abort();
      request.current = null;
    };
  }, []);

  return <main className="agent-shell min-h-screen px-5 py-9">
    <div className="mx-auto max-w-5xl">
      <BrandLogo />
      <section className="agent-card mt-10 p-8 sm:p-12">
        <Link className="text-sm text-[#777]" href="/">← Dashboard</Link>
        <h1 className="mt-5 text-3xl font-semibold">Recently added jobs</h1>
        <p className="mt-2 text-[#777]">Jobs matched to your preferences.</p>
        <div className="mt-8">
          {loading && !items.length && <div role="status" aria-busy="true" className="loading-placeholder space-y-5">
            <span className="sr-only">Finding your matches</span>
            {[0, 1, 2, 3].map((index) => <div key={index} aria-hidden="true" className="flex items-center gap-4 py-3"><div className="loading-skeleton h-14 w-14 shrink-0 rounded-2xl" /><div className="flex-1 space-y-3"><div className="loading-skeleton h-4 w-3/4 rounded-full" /><div className="loading-skeleton h-3 w-1/3 rounded-full" /></div></div>)}
          </div>}
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
        {error && <div className="mt-4">
          <p role="alert" className="text-sm text-red-700">{error}</p>
          {!cursor && <button className="agent-dark-button mt-4" onClick={() => void load()} type="button">Try again</button>}
        </div>}
        {cursor && <button className="agent-dark-button mt-6 w-full" disabled={loading} onClick={() => void load(cursor)} type="button">{loading ? <PendingDots label="Loading more matches" /> : "Load more"}</button>}
      </section>
    </div>
  </main>;
}
