"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { hasLocalSession } from "../lib/local-auth";
import LogoutButton from "./logout-button";

type SiteHeaderClientProps = {
  active?: "companies" | "jobs" | "resources";
  initialAuthenticated: boolean;
};

type NavLinkProps = {
  active: boolean;
  children: string;
  href: string;
};

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function NavLink({ active, children, href }: NavLinkProps) {
  const className = active
    ? "border-b-2 border-slate-950 pb-3 font-semibold text-slate-950"
    : "border-b-2 border-transparent pb-3 font-medium text-slate-500 transition hover:text-slate-950";

  return <Link className={className} href={href}>{children}</Link>;
}

function GuestActions() {
  return (
    <div className="flex shrink-0 items-center gap-7 text-[15px] font-semibold">
      <Link className="hidden text-slate-950 transition hover:text-slate-600 sm:block" href="/login">Sign in</Link>
      <Link className="rounded-full bg-slate-950 px-8 py-3.5 text-white shadow-[0_6px_16px_rgba(15,23,42,0.14)] transition hover:bg-slate-800" href="/register">Sign up</Link>
    </div>
  );
}

function UserDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-3 text-[15px] font-semibold text-slate-950"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-lg font-semibold text-white">H</span>
        <span className="hidden lg:block">Account</span>
        <span className="hidden lg:block"><ChevronDownIcon /></span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+16px)] z-30 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-[0_20px_45px_rgba(15,23,42,0.16)]" role="menu">
          <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-50" type="button">
            <UserIcon />
            Account settings
          </button>
          <div className="mx-4 border-t border-slate-100" />
          <LogoutButton onComplete={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function subscribeToLocalSession(callback: () => void) {
  window.addEventListener("storage", callback);

  return () => window.removeEventListener("storage", callback);
}

export default function SiteHeaderClient({ active, initialAuthenticated }: SiteHeaderClientProps) {
  const hasClientSession = useSyncExternalStore(
    subscribeToLocalSession,
    hasLocalSession,
    () => false,
  );
  const isAuthenticated = initialAuthenticated || hasClientSession;

  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="relative grid min-h-[82px] grid-cols-[minmax(145px,220px)_1fr_auto] items-center gap-x-6 px-6 sm:px-10 lg:min-h-[96px] lg:px-14">
        <Link aria-label="HunterJob home" className="w-full max-w-[190px]" href="/">
          <Image
            alt="HunterJob"
            className="h-auto w-full object-contain"
            height={264}
            priority
            src="/assets/branding/hunterjob-wordmark.png"
            width={1359}
          />
        </Link>

        <nav aria-label="Primary navigation" className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-10 text-[15px] xl:flex">
          <NavLink active={active === "jobs"} href="/jobs">Jobs</NavLink>
          <NavLink active={active === "companies"} href="/jobs#companies">Companies</NavLink>
          <NavLink active={active === "resources"} href="/jobs#resources">Resources</NavLink>
        </nav>

        <div className="justify-self-end">
          {isAuthenticated ? <UserDropdown /> : <GuestActions />}
        </div>
      </div>
    </header>
  );
}
