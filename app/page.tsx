import Link from "next/link";
import SiteHeader from "./components/site-header";
import { latestJobs, listCompanies } from "./lib/hunterjob-api";

function PinIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default async function Home() {
  const [result, companiesResult] = await Promise.all([latestJobs(), listCompanies()]);
  const jobs = result.data ?? [];
  const companyNames = Object.fromEntries((companiesResult.data ?? []).map((company) => [company.id, company.name]));

  return (
    <main className="min-h-screen bg-[#fbfcff] text-[#111b35]">
      <SiteHeader active="jobs" />

      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-14">
        <section className="pb-16 pt-20 sm:pb-20 sm:pt-24">
          <p className="text-sm font-bold tracking-tight text-[#1e4fff]">OFFICIAL CAREER SOURCES</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-[-0.045em] text-[#101a34] sm:text-6xl">
            There job for you. Good luck.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6d7d9f] sm:text-lg">
            Fresh opportunities discovered directly from company career pages.
            <br className="hidden sm:block" /> HunterJob is not the employer—we point you to the original source.
          </p>

          <form action="/jobs" className="mt-10 flex flex-col overflow-hidden rounded-xl border border-[#dbe3f1] bg-white shadow-[0_4px_14px_rgba(27,48,89,0.04)] sm:flex-row">
            <label className="flex flex-1 items-center gap-4 px-5 py-4 text-[#1a2a48]">
              <svg aria-hidden="true" className="h-6 w-6 flex-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
              <input className="min-w-0 flex-1 outline-none placeholder:text-[#8290ad]" name="keyword" placeholder="Search jobs, skills, or companies" type="search" />
            </label>
            <label className="flex items-center gap-3 border-t border-[#e7ecf5] px-5 py-4 text-sm font-medium sm:border-l sm:border-t-0">
              <PinIcon />
              <select aria-label="Location" className="min-w-28 bg-transparent outline-none" name="location">
                <option value="">Any location</option>
                <option>Da Nang</option>
                <option>Remote</option>
                <option>Ho Chi Minh City</option>
              </select>
            </label>
            <button className="m-2 rounded-lg bg-[#1e4fff] px-8 py-3 text-sm font-semibold text-white shadow-[0_6px_12px_rgba(30,79,255,0.2)] transition hover:bg-[#1742dd]" type="submit">
              Search
            </button>
          </form>
        </section>

        <section className="pb-10" id="jobs">
          <div className="flex items-center justify-between border-b border-[#e3e9f3] pb-3 text-sm text-[#7382a1]">
            <p>{jobs.length ? `${jobs.length} jobs` : "Latest jobs"}</p>
            <Link className="rounded-lg border border-[#dce4f1] bg-white px-4 py-2 font-medium text-[#263653]" href="/jobs">
              Browse all jobs
            </Link>
          </div>

          <div>
            {jobs.length ? jobs.map((job) => (
              <Link className="group grid gap-3 border-b border-[#e8edf5] px-3 py-5 transition hover:bg-white sm:grid-cols-[minmax(0,1fr)_180px_24px] sm:items-center" href={`/jobs/${job.id}`} key={job.id}>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-[#111b35]">{job.title}</p>
                  <p className="mt-1 truncate text-sm text-[#71809f]">{companyNames[job.company_id] ?? "Verified company"} · {job.skills.slice(0, 3).join(" · ") || "Official career source"}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#71809f]">
                  <PinIcon />
                  {job.locations[0]?.city ?? "Location not listed"}
                </div>
                <span aria-hidden="true" className="text-xl text-[#142240] transition group-hover:translate-x-1">›</span>
              </Link>
            )) : <div className="py-12 text-center text-[#71809f]">{result.error ?? "New verified opportunities will appear here soon."}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
