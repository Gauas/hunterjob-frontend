import SiteHeader from "../components/site-header";
import { listCompanies } from "../lib/hunterjob-api";

export default async function CompaniesPage() {
  const result = await listCompanies();
  const companies = result.data ?? [];

  return (
    <main className="min-h-screen bg-[#fbfcff] text-[#111b35]">
      <SiteHeader active="companies" />
      <section className="mx-auto max-w-6xl px-6 py-14 sm:px-10 lg:px-14">
        <p className="text-sm font-bold text-[#1e4fff]">VERIFIED SOURCES</p>
        <h1 className="mt-3 text-4xl font-bold">Companies</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Organizations whose official career sources are monitored by HunterJob.</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.length ? companies.map((company) => (
            <a className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm" href={company.website} key={company.id} rel="noreferrer" target="_blank">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-700">
                {company.name.slice(0, 2).toUpperCase()}
              </div>
              <h2 className="mt-5 text-xl font-semibold group-hover:text-blue-700">{company.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{company.locations?.join(", ") || "Locations listed per job"}</p>
              <p className="mt-5 text-sm font-semibold text-blue-700">Official website ↗</p>
            </a>
          )) : <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-600">{result.error ?? "No companies are available yet."}</div>}
        </div>
      </section>
    </main>
  );
}
