"use client";

import Image from "next/image";
import { useState } from "react";

export default function JobCompanyMark({ name, logoURL }: { name: string; logoURL?: string }) {
  const [broken, setBroken] = useState(false);
  return <span className="job-company-icon overflow-hidden" aria-label={name}>
    {logoURL && !broken
      ? <Image alt="" className="h-full w-full object-contain bg-white p-1" height={56} onError={() => setBroken(true)} src={logoURL} unoptimized width={56} />
      : (name[0] ?? "?").toUpperCase()}
  </span>;
}
