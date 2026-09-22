import Link from "next/link";
import SiteHeader from "../components/site-header";
import { listJobs } from "../lib/hunterjob-api";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Jobs({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const keyword = firstValue(params.keyword) ?? "";
  const location = firstValue(params.location) ?? "";
  const result = await listJobs({ keyword, location, limit: 50 });
  const data = result.data ?? [];

  return (
    <main className="min-h-screen bg-[#fbfcff] text-[#111b35]">
      <SiteHeader active="jobs" />

      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:px-14">
        <div className="grid gap-10 md:grid-cols-[220px_1fr]">
          <aside className="hidden border-r border-slate-200 pr-6 md:block">
            <h2 className="font-semibold">Filter jobs</h2>
            <form className="mt-4 space-y-3 text-sm" method="get">
              <input className="w-full border border-slate-200 px-3 py-2" defaultValue={keyword} name="keyword" placeholder="Role or skill" type="search" />
              <input className="w-full border border-slate-200 px-3 py-2" defaultValue={location} name="location" placeholder="Location" />
              <button className="w-full bg-[#1e4fff] px-3 py-2 font-semibold text-white" type="submit">Apply filters</button>
            </form>
          </aside>

          <section>
            <p className="text-sm font-semibold text-brand">LATEST VERIFIED JOBS</p>
            <h1 className="mt-2 text-3xl font-bold">Open opportunities</h1>

            <div className="mt-8 space-y-3">
              {data.length ? data.map((job) => (
                <Link className="block border border-slate-200 bg-white p-6 transition hover:border-slate-400" href={`/jobs/${job.id}`} key={job.id}>
                  <h2 className="text-xl font-semibold">{job.title}</h2>
                  <p className="mt-2 text-slate-600">Techvify · {job.locations.map((location) => location.city).join(", ") || "Location not listed"}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    {[...job.levels, ...job.skills].slice(0, 5).map((value) => (
                      <span className="border border-slate-200 px-2 py-1 text-slate-600" key={value}>{value}</span>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-slate-500">Verified {new Date(job.last_seen_at).toLocaleDateString()}</p>
                </Link>
              )) : <div className="border border-slate-200 bg-white p-8 text-slate-600">{result.error ?? "No jobs have been verified yet. The crawler will publish roles here once it completes its first run."}</div>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
