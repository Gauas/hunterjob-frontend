import BrandLogo from "./brand-logo";

export default function PagePending() {
  return (
    <main aria-busy="true" className="agent-shell min-h-screen px-5 py-9">
      <div className="mx-auto max-w-5xl">
        <BrandLogo />
        <div aria-hidden="true" className="agent-card mt-10 space-y-7 p-8 sm:p-12">
          <div className="h-7 w-44 animate-pulse rounded-full bg-[#f0f0f0]" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="h-24 animate-pulse rounded-2xl bg-[#f5f5f5]" />
            <div className="h-24 animate-pulse rounded-2xl bg-[#f5f5f5]" />
          </div>
          <div className="h-24 animate-pulse rounded-2xl bg-[#f5f5f5]" />
        </div>
      </div>
      <span className="sr-only">Preparing your page</span>
    </main>
  );
}
