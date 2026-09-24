import Link from "next/link";
import SiteHeader from "../components/site-header";
import { type Company, type Job, listCompanies, listJobs } from "../lib/hunterjob-api";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function positivePage(value: string | undefined) { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : 1; }
function apiKeyword(value: string) {
  const aliases: Record<string, string> = { nextjs: "Next.js", nodejs: "Node.js", reactjs: "React.js", vuejs: "Vue.js" };
  return aliases[value.toLowerCase().replace(/[^a-z0-9]/g, "")] ?? value;
}
function pageHref(params: SearchParams, page: number) {
  const query = new URLSearchParams();
  for (const key of ["keyword", "location", "level", "remote"]) { const value = firstValue(params[key]); if (value) query.set(key, value); }
  query.set("page", String(page));
  return `/jobs?${query.toString()}`;
}
function searchHref(keyword: string) { return `/jobs?keyword=${encodeURIComponent(keyword)}`; }
function companyInitials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "H"; }

function CompanyMark({ company, compact = false }: { company?: Company; compact?: boolean }) {
  const size = compact ? "h-10 w-10" : "h-14 w-14";
  if (company?.logo_url) return <img alt={`${company.name} logo`} className={`${size} rounded-xl border border-slate-100 bg-white object-contain p-1.5`} src={company.logo_url} />;
  return <span aria-label={company?.name ?? "Company"} className={`${size} flex shrink-0 items-center justify-center rounded-xl bg-[#edf2ff] text-sm font-bold text-[#173d9b]`}>{companyInitials(company?.name ?? "HunterJob")}</span>;
}
function SearchIcon() { return <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>; }
function PinIcon() { return <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>; }
function ArrowIcon() { return <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function BookmarkIcon() { return <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z" /></svg>; }
function jobLocation(job: Job) { return job.locations.map((item) => [item.city, item.country].filter(Boolean).join(", ")).filter(Boolean)[0] ?? "Location not listed"; }
function relativeDate(value: string) { const days = Math.floor(Math.max(0, Date.now() - new Date(value).getTime()) / 86_400_000); return days === 0 ? "Posted today" : `Posted ${days} day${days === 1 ? "" : "s"} ago`; }

export default async function Jobs({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const keyword = firstValue(params.keyword) ?? "";
  const location = firstValue(params.location) ?? "";
  const level = firstValue(params.level) ?? "";
  const remoteValue = firstValue(params.remote) ?? "";
  const remote = remoteValue === "true" ? true : remoteValue === "false" ? false : undefined;
  const page = positivePage(firstValue(params.page));
  const [jobsResult, companiesResult] = await Promise.all([listJobs({ keyword: apiKeyword(keyword), location, level, remote, page, limit: 8 }), listCompanies()]);
  const jobs = jobsResult.data ?? [];
  const companies = companiesResult.data ?? [];
  const companyByID = new Map(companies.map((company) => [company.id, company]));
  const popularCompanies = companies.slice(0, 8);
  const meta = jobsResult.meta;

  return <main className="min-h-screen overflow-hidden bg-[#fbfcff] text-[#0a1735]">
    <SiteHeader active="jobs" />
    <section className="relative isolate overflow-hidden border-b border-[#e5ebf8] bg-[radial-gradient(circle_at_77%_57%,rgba(198,216,255,.95),transparent_22%),radial-gradient(circle_at_57%_75%,rgba(213,226,255,.9),transparent_27%),linear-gradient(145deg,#fbfdff_6%,#edf4ff_65%,#dbe9ff)]">
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(155deg,transparent_0%,transparent_30%,rgba(100,139,207,.18)_31%,rgba(224,236,255,.5)_58%,transparent_59%),linear-gradient(25deg,transparent_44%,rgba(114,153,217,.2)_45%,rgba(238,245,255,.92)_62%,transparent_63%)]" />
      <div aria-hidden="true" className="absolute -right-12 bottom-0 h-64 w-[40rem] opacity-40 [background:repeating-radial-gradient(ellipse_at_bottom_right,transparent_0,transparent_34px,#a8c4f3_35px,transparent_37px)]" />
      <div className="relative mx-auto max-w-[1280px] px-6 pb-10 pt-12 sm:px-10 lg:px-14 lg:pb-12 lg:pt-14">
        <div className="max-w-[690px]"><p className="text-sm font-bold uppercase tracking-wide text-[#1d56e8]">Official career sources</p><h1 className="mt-4 max-w-[640px] text-4xl font-bold leading-[1.12] tracking-[-.045em] text-[#0c1b42] sm:text-5xl lg:text-[54px]">Find the right job<br className="hidden sm:block" /> for your next chapter.</h1><p className="mt-4 max-w-[650px] text-base leading-6 text-[#425b91] sm:text-lg">Fresh opportunities discovered directly from company career pages.<br className="hidden md:block" /> HunterJob is not the employer — we point you to the original source.</p></div>
        <form className="relative mt-7 grid max-w-[1110px] gap-y-3 rounded-[28px] border border-white/80 bg-white/95 px-5 py-4 shadow-[0_22px_45px_rgba(54,86,145,.17)] md:grid-cols-[1fr_300px_68px] md:items-center md:gap-y-0 md:px-9" method="get">
          <label className="flex min-w-0 items-center gap-5 border-b border-[#e8edf8] pb-3 text-[#0d265d] md:border-b-0 md:border-r md:pb-0 md:pr-8"><SearchIcon /><input className="min-w-0 flex-1 bg-transparent text-base text-[#102557] outline-none placeholder:text-[#6d82b2]" defaultValue={keyword} name="keyword" placeholder="Search jobs, skills, or companies" type="search" /></label>
          <label className="flex items-center gap-4 pt-2 text-[#0d265d] md:px-8 md:pt-0"><PinIcon /><input className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[#102557]" defaultValue={location} name="location" placeholder="Any location" /></label>
          <button aria-label="Search jobs" className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#080f20] text-white shadow-[0_9px_19px_rgba(8,15,32,.28)] transition hover:bg-black md:h-16 md:w-16" type="submit"><ArrowIcon /></button>
        </form>
        <div className="relative ml-3 mt-[-1px] flex max-w-[680px] flex-wrap gap-2 px-6 pb-1 pt-3">{["Software Engineer", "DevOps", "Data & AI", "Frontend", "Backend"].map((term) => <Link className="rounded-full bg-[#eaf0ff] px-3 py-1.5 text-xs font-medium text-[#1749bd] transition hover:bg-[#dce7ff]" href={searchHref(term)} key={term}>{term}</Link>)}</div>
      </div>
    </section>
    <section className="mx-auto grid max-w-[1360px] gap-9 px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-14">
      <div><div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">Latest jobs</h2>{meta && <p className="mt-1 text-sm text-slate-500">{meta.total} opportunities from official sources</p>}</div><span className="hidden text-sm text-slate-600 sm:block">Sort by <strong className="ml-2 rounded-lg bg-[#f2f5fc] px-3 py-2 font-medium text-[#0c1b42]">Most recent</strong></span></div>
        <div className="mt-4 space-y-3">{jobs.length ? jobs.map((job) => {
          const company = companyByID.get(job.company_id); const tags = [...job.skills, ...job.levels].filter((tag, index, all) => tag && all.indexOf(tag) === index).slice(0, 4);
          return <Link className="group flex gap-4 rounded-2xl border border-[#e6ebf5] bg-white p-4 shadow-[0_5px_18px_rgba(31,56,105,.035)] transition hover:-translate-y-0.5 hover:border-[#becdf0] hover:shadow-[0_12px_28px_rgba(31,56,105,.1)] sm:items-center sm:p-5" href={`/jobs/${job.id}`} key={job.id}><CompanyMark company={company} /><div className="min-w-0 flex-1"><h3 className="truncate text-base font-bold text-[#0c1836] sm:text-lg">{job.title}</h3><p className="mt-0.5 text-sm font-medium text-[#425a90]">{company?.name ?? "Company"}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#546b9e]"><span className="inline-flex items-center gap-1"><PinIcon />{jobLocation(job)}</span><span>{job.employment_type || "Full-time"}</span><span>{relativeDate(job.last_seen_at)}</span></div></div><div className="hidden max-w-[310px] flex-1 flex-wrap justify-end gap-2 lg:flex">{tags.map((tag) => <span className="rounded-full bg-[#f0f4fc] px-3 py-1.5 text-xs font-medium text-[#183267]" key={tag}>{tag}</span>)}</div><span className="mt-1 text-[#193b7d] sm:self-center"><BookmarkIcon /></span></Link>;
        }) : <div className="rounded-2xl border border-[#e6ebf5] bg-white p-8 text-slate-600">{jobsResult.error ?? "No jobs match these filters yet."}</div>}</div>
        {meta && meta.total_pages > 1 && <nav aria-label="Job result pages" className="mt-7 flex items-center justify-between">{page > 1 ? <Link className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold" href={pageHref(params, page - 1)}>← Previous</Link> : <span />}{page < meta.total_pages ? <Link className="rounded-full bg-[#080f20] px-5 py-2.5 text-sm font-bold text-white hover:bg-black" href={pageHref(params, page + 1)}>Next →</Link> : <span />}</nav>}
      </div>
      <aside className="space-y-6"><section><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Popular companies</h2><Link className="text-sm font-semibold text-[#1d56e8]" href="/companies">View all</Link></div><div className="mt-4 grid grid-cols-4 gap-2">{popularCompanies.length ? popularCompanies.map((company) => <Link className="flex min-h-[98px] flex-col items-center justify-center gap-2 rounded-xl border border-[#e6ebf5] bg-white px-1 text-center transition hover:border-[#bfd0f3]" href={`/companies/${company.slug}`} key={company.id}><CompanyMark compact company={company} /><span className="line-clamp-1 max-w-full text-[11px] font-medium text-[#435b90]">{company.name}</span></Link>) : <p className="col-span-4 rounded-xl bg-white p-4 text-sm text-slate-500">Companies will appear here soon.</p>}</div></section>
        <section className="rounded-2xl bg-[linear-gradient(135deg,#edf3ff,#e1ebff)] p-5"><h2 className="text-lg font-bold">Get new jobs, daily</h2><p className="mt-1 max-w-[210px] text-sm leading-5 text-[#4c6393]">Be the first to see fresh opportunities from company career pages.</p><Link className="mt-4 block rounded-lg bg-[#080f20] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-black" href="/register">Create an account</Link></section>
        <section id="resources"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Explore resources</h2><Link className="text-sm font-semibold text-[#1d56e8]" href="/resources">View all</Link></div><div className="mt-3 divide-y divide-[#e6ebf5] rounded-xl border border-[#e6ebf5] bg-white"><Link className="flex items-center justify-between p-4 text-sm font-semibold hover:bg-slate-50" href="/resources"><span><span className="block text-[#10204b]">Resume tips for junior developers</span><span className="mt-1 block text-xs font-normal text-[#6075a3]">Practical tips to improve your resume.</span></span><span className="text-lg text-[#1d56e8]">›</span></Link><Link className="flex items-center justify-between p-4 text-sm font-semibold hover:bg-slate-50" href="/resources"><span><span className="block text-[#10204b]">Interview preparation</span><span className="mt-1 block text-xs font-normal text-[#6075a3]">Common questions and how to answer.</span></span><span className="text-lg text-[#1d56e8]">›</span></Link></div></section>
      </aside>
    </section>
  </main>;
}
