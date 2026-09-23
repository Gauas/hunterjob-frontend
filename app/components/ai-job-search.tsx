"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type SearchJob = {
  id: string;
  company_id: string;
  title: string;
  locations?: { city: string; country: string; remote: boolean }[];
  levels?: string[];
  skills?: string[];
};

type SearchResult = {
  match_score: number;
  matched?: string[];
  missing?: string[];
  explanation?: string;
  job: SearchJob;
};

type SearchResponse = {
  data?: SearchResult[];
  error?: string;
};

export default function AIJobSearch({ companyNames }: { companyNames: Record<string, string> }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/jobs/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: value }),
      });
      const payload = (await response.json().catch(() => null)) as SearchResponse | null;
      if (!response.ok) throw new Error(payload?.error || "AI search is temporarily unavailable.");
      setResults(payload?.data ?? []);
    } catch (reason) {
      setResults([]);
      setError(reason instanceof Error ? reason.message : "AI search is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-10 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">AI job matching</p>
      <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
        <input
          className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Example: Senior Node.js role in Da Nang"
          value={query}
        />
        <button className="rounded-lg bg-[#1e4fff] px-5 py-3 font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">
          {loading ? "Matching…" : "Find matches"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {results.length > 0 && (
        <div className="mt-5 grid gap-3">
          {results.map(({ job, match_score: score, matched }) => (
            <Link className="rounded-xl border border-blue-100 bg-white p-4 transition hover:border-blue-300" href={`/jobs/${job.id}`} key={job.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[#111b35]">{job.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {companyNames[job.company_id] ?? "Company"} · {job.locations?.map((item) => item.city).filter(Boolean).join(", ") || "Location not listed"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">{score}%</span>
              </div>
              {!!matched?.length && <p className="mt-3 text-xs text-slate-500">Matched: {matched.join(", ")}</p>}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
