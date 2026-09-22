"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { localAccessToken } from "../lib/local-auth";

type Gender = "female" | "male" | "other";

type Profile = {
  dob?: string;
  first_name?: string;
  gender?: Gender;
  last_name?: string;
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function authHeaders() {
  const accessToken = localAccessToken();

  if (!accessToken) return undefined;

  return { Authorization: `Bearer ${accessToken}` };
}

function parseDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function isValidDate(day: string, month: string, year: string) {
  const numericDay = Number(day);
  const numericMonth = Number(month);
  const numericYear = Number(year);
  const date = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));

  return date.getUTCDate() === numericDay
    && date.getUTCMonth() === numericMonth - 1
    && date.getUTCFullYear() === numericYear;
}

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const response = await fetch("/api/profile", { headers: authHeaders() });

      if (!response.ok) return;

      const profile = (await response.json()) as Profile;

      if (cancelled) return;

      const date = parseDate(profile.dob);
      const complete = Boolean(profile.first_name && profile.last_name && profile.gender && date);

      if (complete) {
        router.replace("/jobs");
        return;
      }

      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setGender(profile.gender ?? "");
      setDay(date ? String(date.getUTCDate()) : "");
      setMonth(date ? String(date.getUTCMonth() + 1) : "");
      setYear(date ? String(date.getUTCFullYear()) : "");
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function nextFromName() {
    const valid = Boolean(firstName.trim() && lastName.trim());

    if (!valid) {
      setError("Please enter your first and last name.");
      return;
    }

    setError("");
    setStep(1);
  }

  function nextFromGender() {
    if (!gender) {
      setError("Please select an option.");
      return;
    }

    setError("");
    setStep(2);
  }

  async function finish() {
    if (!isValidDate(day, month, year)) {
      setError("Please enter a valid date of birth.");
      return;
    }

    setError("");
    setPending(true);

    const dob = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const response = await fetch("/api/profile", {
      body: JSON.stringify({
        dob,
        first_name: firstName.trim(),
        gender,
        last_name: lastName.trim(),
      }),
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      method: "PATCH",
    });

    if (!response.ok) {
      setError("We could not save your profile. Please try again.");
      setPending(false);
      return;
    }

    router.replace("/jobs");
    router.refresh();
  }

  const currentYear = new Date().getUTCFullYear();
  const years = Array.from({ length: 100 }, (_, index) => String(currentYear - index));

  return (
    <main className="min-h-screen bg-[#fdfdfd] text-[#08111f]">
      <header className="flex items-center justify-between px-8 py-10 sm:px-14">
        <Link aria-label="HunterJob home" className="w-[178px]" href="/">
          <Image alt="HunterJob" className="h-auto w-full" height={264} priority src="/assets/branding/hunterjob-wordmark.png" width={1359} />
        </Link>
        <Link className="text-lg text-slate-500 underline underline-offset-4 transition hover:text-slate-900" href="/jobs">Skip</Link>
      </header>

      <section className="mx-auto flex w-full max-w-[940px] flex-col items-center px-6 pb-16 pt-24 sm:pt-36">
        {step === 0 && (
          <div className="w-full">
            <h1 className="text-center text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">What’s your name?</h1>
            <div className="mx-auto mt-16 grid max-w-[940px] gap-7 sm:grid-cols-2 sm:gap-7">
              <label className="text-xl font-medium">
                First name
                <input className="mt-3 h-[68px] w-full rounded-xl border border-slate-300 bg-white px-6 text-xl outline-none transition placeholder:text-slate-400 focus:border-slate-500" onChange={(event) => setFirstName(event.target.value)} placeholder="First name" value={firstName} />
              </label>
              <label className="text-xl font-medium">
                Last name
                <input className="mt-3 h-[68px] w-full rounded-xl border border-slate-300 bg-white px-6 text-xl outline-none transition placeholder:text-slate-400 focus:border-slate-500" onChange={(event) => setLastName(event.target.value)} placeholder="Last name" value={lastName} />
              </label>
            </div>
            <div className="mt-20 text-center">
              {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
              <button className="inline-flex h-16 min-w-[415px] items-center justify-center gap-5 rounded-full bg-[#0b1621] px-10 text-xl font-medium text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:opacity-60" onClick={nextFromName} type="button">
                Continue <ArrowIcon />
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="w-full max-w-[565px]">
            <h1 className="text-center text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">What’s your gender?</h1>
            <div className="mt-12 space-y-5">
              {(["male", "female", "other"] as Gender[]).map((option) => (
                <label className="flex h-[88px] cursor-pointer items-center gap-6 rounded-xl border border-slate-300 bg-white px-8 text-2xl transition has-[:checked]:border-slate-950 has-[:checked]:bg-slate-50" key={option}>
                  <input checked={gender === option} className="h-8 w-8 accent-slate-950" name="gender" onChange={() => setGender(option)} type="radio" value={option} />
                  {option[0].toUpperCase() + option.slice(1)}
                </label>
              ))}
            </div>
            <div className="mt-14 text-center">
              {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
              <button className="inline-flex h-16 min-w-[415px] items-center justify-center gap-5 rounded-full bg-[#0b1621] px-10 text-xl font-medium text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition hover:bg-slate-800" onClick={nextFromGender} type="button">
                Continue <ArrowIcon />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-[800px]">
            <h1 className="text-center text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">How old are you?</h1>
            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              <label className="text-xl font-medium">
                Day
                <select className="mt-3 h-[68px] w-full rounded-xl border border-slate-300 bg-white px-6 text-xl text-slate-700 outline-none" onChange={(event) => setDay(event.target.value)} value={day}>
                  <option value="">DD</option>
                  {Array.from({ length: 31 }, (_, index) => String(index + 1)).map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-xl font-medium">
                Month
                <select className="mt-3 h-[68px] w-full rounded-xl border border-slate-300 bg-white px-6 text-xl text-slate-700 outline-none" onChange={(event) => setMonth(event.target.value)} value={month}>
                  <option value="">MM</option>
                  {months.map((value, index) => <option key={value} value={String(index + 1)}>{value}</option>)}
                </select>
              </label>
              <label className="text-xl font-medium">
                Year
                <select className="mt-3 h-[68px] w-full rounded-xl border border-slate-300 bg-white px-6 text-xl text-slate-700 outline-none" onChange={(event) => setYear(event.target.value)} value={year}>
                  <option value="">YYYY</option>
                  {years.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-20 text-center">
              {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
              <button className="inline-flex h-16 min-w-[400px] items-center justify-center gap-5 rounded-full bg-[#0b1621] px-10 text-xl font-medium text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60" disabled={pending} onClick={finish} type="button">
                {pending ? "Saving..." : "Continue"} <ArrowIcon />
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
