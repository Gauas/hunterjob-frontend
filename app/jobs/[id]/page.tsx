import Link from "next/link";
import SiteHeader from "../../components/site-header";
import { applicationRedirectUrl, getJob, listCompanies } from "../../lib/hunterjob-api";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, companiesResult] = await Promise.all([getJob(id), listCompanies()]);
  const job = result.data;

  if (!job) {
    return (
      <main className="min-h-screen bg-[#fbfcff] text-[#111b35]">
        <SiteHeader active="jobs" />
        <div className="mx-auto max-w-3xl px-6 py-10">Job not found.</div>
      </main>
    );
  }

  const company = (companiesResult.data ?? []).find((item) => item.id === job.company_id);

  return (
    <main className="min-h-screen bg-[#fbfcff] text-[#111b35]">
      <SiteHeader active="jobs" />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link className="text-sm font-semibold text-brand" href="/jobs">← All jobs</Link>
        <p className="mt-10 text-sm font-semibold text-brand">{company?.name ?? "VERIFIED COMPANY"}</p>
        <h1 className="mt-2 text-4xl font-bold">{job.title}</h1>
        <p className="mt-4 text-slate-600">
          {job.locations.map((location) => location.city).join(", ")} · {job.levels.join(", ") || "Level not listed"}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {job.skills.map((skill) => (
            <span className="border border-slate-200 bg-white px-2 py-1 text-sm" key={skill}>{skill}</span>
          ))}
        </div>

        <a className="mt-10 inline-block bg-brand px-5 py-3 font-semibold text-white" href={applicationRedirectUrl(job.id)}>
          Apply on company website
        </a>
        <p className="mt-3 text-sm text-slate-500">
          Source: Official company career page · Last verified {new Date(job.last_seen_at).toLocaleString()}
        </p>

        {job.description && <article className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-semibold">Role overview</h2>
          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">{job.description}</p>
        </article>}
      </div>
    </main>
  );
}
