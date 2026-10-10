import BrandLogo from "./brand-logo";

export default function PagePending() {
  return (
    <main aria-busy="true" role="status" className="agent-shell min-h-screen px-5 py-9">
      <div className="mx-auto max-w-5xl">
        <BrandLogo />
        <div aria-hidden="true" className="agent-card mt-10 space-y-7 p-8 sm:p-12">
          <div className="loading-skeleton h-7 w-44 rounded-full" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="loading-skeleton h-24 rounded-2xl" />
            <div className="loading-skeleton h-24 rounded-2xl" />
          </div>
          <div className="loading-skeleton h-24 rounded-2xl" />
        </div>
      </div>
      <span className="sr-only">Preparing your page</span>
    </main>
  );
}
