export default function PendingDots({ label = "Loading" }: { label?: string }) {
  return <span role="status" className="inline-flex h-5 items-center justify-center gap-1.5 align-middle">
    <span className="sr-only">{label}</span>
    {[0, 1, 2].map((index) => <span key={index} aria-hidden="true" className="pending-dot h-1.5 w-1.5 rounded-full bg-current" style={{ animationDelay: `${index * 140}ms` }} />)}
  </span>;
}
