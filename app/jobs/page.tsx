import Link from "next/link";
import AIJobSearch from "../components/ai-job-search";
import SiteHeader from "../components/site-header";
import { listCompanies, listJobs } from "../lib/hunterjob-api";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function positivePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function pageHref(params: SearchParams, page: number) {
  const query = new URLSearchParams();
  for (const key of ["keyword", "location", "level", "remote"]) {
    const value = firstValue(params[key]);
    if (value) query.set(key, value);
  }
  query.set("page", String(page));
  return `/jobs?${query.toString()}`;
}

export default async function Jobs({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const keyword = firstValue(params.keyword) ?? "";
  const location = firstValue(params.location) ?? "";
  const level = firstValue(params.level) ?? "";
  const remoteValue = firstValue(params.remote) ?? "";
  const remote = remoteValue === "true" ? true : remoteValue === "false" ? false : undefined;
  const page = positivePage(firstValue(params.page));

  const [jobsResult, companiesResult] = await Promise.all([
    listJobs({ keyword, location, level, remote, page, limit: 12 }),
    listCompanies(),
  ]);
  const jobs = jobsResult.data ?? [];
  const companies = companiesResult.data ?? [];
  const companyNames = Object.fromEntries(companies.map((company) => [company.id, company.name]));
  const meta = jobsResult.meta;

  return (
    <main className="min-h-screen bg-[#fbfcff] text-[#111b35]">
      <SiteHeader active="jobs" />
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:px-14">
        <AIJobSearch companyNames={companyNames} />

        <div className="grid gap-10 md:grid-cols-[240px_1fr]">
          <aside className="border-b border-slate-200 pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-6">
            <h2 className="font-semibold">Filter jobs</h2>
            <form className="mt-4 grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-1" method="get">
              <input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5" defaultValue={keyword} name="keyword" placeholder="Role or skill" type="search" />
              <input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5" defaultValue={location} name="location" placeholder="Location" />
              <input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5" defaultValue={level} name="level" placeholder="Level, e.g. Senior" />
              <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5" defaultValue={remoteValue} name="remote">
                <option value="">Any work mode</option>
                <option value="true">Remote</option>
                <option value="false">On-site / hybrid</option>
              </select>
              <button className="rounded-lg bg-[#1e4fff] px-3 py-2.5 font-semibold text-white" type="submit">Apply filters</button>
              {(keyword || location || level || remoteValue) && <Link className="py-2 text-center font-semibold text-slate-500" href="/jobs">Clear filters</Link>}
            </form>
          </aside>

          <section>
            <p className="text-sm font-semibold text-brand">LATEST VERIFIED JOBS</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <h1 className="text-3xl font-bold">Open opportunities</h1>
              {meta && <p className="text-sm text-slate-500">{meta.total} jobs · Page {meta.page} of {Math.max(meta.total_pages, 1)}</p>}
            </div>

            <div className="mt-8 space-y-3">
              {jobs.length ? jobs.map((job) => (
                <Link className="block rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-400 hover:shadow-sm" href={`/jobs/${job.id}`} key={job.id}>
                  <h2 className="text-xl font-semibold">{job.title}</h2>
                  <p className="mt-2 text-slate-600">
                    {companyNames[job.company_id] ?? "Company"} · {job.locations.map((item) => item.city).filter(Boolean).join(", ") || "Location not listed"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    {[...job.levels, ...job.skills].slice(0, 6).map((value) => (
                      <span className="rounded-md border border-slate-200 px-2 py-1 text-slate-600" key={value}>{value}</span>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-slate-500">Verified {new Date(job.last_seen_at).toLocaleDateString()}</p>
                </Link>
              )) : <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-600">{jobsResult.error ?? "No jobs match these filters."}</div>}
            </div>

            {meta && meta.total_pages > 1 && (
              <nav aria-label="Job result pages" className="mt-8 flex items-center justify-between">
                {page > 1 ? <Link className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold" href={pageHref(params, page - 1)}>← Previous</Link> : <span />}
                {page < meta.total_pages ? <Link className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold" href={pageHref(params, page + 1)}>Next →</Link> : <span />}
              </nav>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
