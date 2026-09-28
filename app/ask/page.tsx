"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { agentRequest, Preference } from "../lib/agent-client";
import { localAccessToken } from "../lib/local-auth";

type Step = "role" | "experience" | "location" | "keywords";
const questions: { key: Step; prompt: string }[] = [
  { key: "role", prompt: "What role are you looking for?" },
  { key: "experience", prompt: "How much experience do you have?" },
  { key: "location", prompt: "Where do you want to work?" },
  { key: "keywords", prompt: "Any keywords to focus on?" },
];
const experienceChoices = new Set(["internship", "fresher", "0-1", "1-2", "2-3", "3-5", "5+"]);

function normalizeExperience(value: string) {
  return value.trim().toLowerCase().replace(/[–—]/g, "-").replace(/\s*(?:years?|yrs?)\s*$/, "").replace(/\s+/g, "");
}

function TypeQuestion({ text }: { text: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    const timer = window.setInterval(() => setCount((current) => Math.min(current + 1, text.length)), 24);
    return () => window.clearInterval(timer);
  }, [text]);
  return <span>{text.slice(0, count)}{count < text.length && <span className="ask-cursor">|</span>}</span>;
}

export default function AskPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<Step, string>>({ role: "", experience: "", location: "", keywords: "" });
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      const token = localAccessToken();
      const response = await fetch("/api/profile", { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!active) return;
      if (!response.ok) { router.replace("/login"); return; }
      const profile = await response.json() as { first_name?: string; last_name?: string; gender?: string; dob?: string };
      if (!profile.first_name || !profile.last_name || !profile.gender || !profile.dob) { router.replace("/onboarding"); return; }
      try {
        const result = await agentRequest<{ data: Preference | null }>("search-preference");
        if (result.data) { router.replace("/"); return; }
      } catch { /* The form remains available and will report save errors. */ }
      setReady(true);
    }
    void load();
    return () => { active = false; };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!value && step !== 3) { setError("Please add an answer to continue."); return; }
    const key = questions[step].key;
    if (key === "experience" && !experienceChoices.has(normalizeExperience(value))) {
      setError("Enter Internship, Fresher, 0-1, 1-2, 2-3, 3-5, or 5+ years.");
      return;
    }
    const next = { ...answers, [key]: value };
    setAnswers(next); setDraft(""); setError("");
    if (step < questions.length - 1) { setStep(step + 1); return; }
    setSaving(true);
    try {
      await agentRequest("search-preference", { method: "PUT", body: JSON.stringify({
        role: next.role,
        experience: normalizeExperience(next.experience),
        locations: [next.location],
        keywords: next.keywords.split(",").map((item) => item.trim()).filter(Boolean),
        excluded_keywords: [], frequency: "daily",
      }) });
      router.replace("/");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save preferences."); setSaving(false); }
  }

  if (!ready) return <main className="agent-shell flex min-h-screen items-center justify-center">Loading…</main>;
  return <main className="ask-shell flex min-h-screen items-center justify-center px-5 py-10 text-[#10131b]">
    <section className="ask-card w-full max-w-[1070px] rounded-[30px] px-7 py-11 sm:px-14 sm:py-16">
      <div className="space-y-10 sm:space-y-14">
        {questions.slice(0, step + 1).map((question, index) => <div className="ask-row grid items-center gap-4 sm:grid-cols-[1fr_auto] sm:gap-8" key={question.key}>
          <p className="text-xl font-medium tracking-[-0.025em] sm:text-[27px]">{index === step ? <TypeQuestion text={question.prompt} /> : question.prompt}</p>
          {index < step && <span className="ask-answer justify-self-start rounded-full bg-[#1b1d1e] px-7 py-3 text-base text-white sm:justify-self-end sm:px-9 sm:py-4 sm:text-xl">{answers[question.key]}</span>}
        </div>)}
      </div>
      <form className="mt-12 sm:mt-16" onSubmit={submit}>
        <div className="flex items-center border-b border-[#d6d6d6] pb-3">
          <input aria-label={questions[step].prompt} autoFocus className="w-full bg-transparent py-2 text-xl outline-none placeholder:text-[#a8a8a8] sm:text-[26px]" onChange={(event) => setDraft(event.target.value)} placeholder={step === 1 ? "e.g. 1-2 years" : step === 3 ? "Kubernetes, Docker, AWS" : "Type your answer"} value={draft} />
          <button aria-label={step === 3 ? "Finish" : "Continue"} className="ml-4 px-3 py-2 text-3xl transition hover:translate-x-1 disabled:opacity-40" disabled={saving} type="submit">➤</button>
        </div>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        {step === 3 && <p className="mt-3 text-sm text-[#999]">Separate keywords with commas. You can leave this blank.</p>}
      </form>
      {step > 0 && <button className="mt-7 text-sm text-[#888] underline underline-offset-4" onClick={() => { setStep(step - 1); setDraft(answers[questions[step - 1].key]); setError(""); }} type="button">Back</button>}
    </section>
  </main>;
}
