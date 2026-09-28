import { localAccessToken } from "./local-auth";

export type Preference = {
  id: string;
  role: string;
  experience: { type: string; min_years: number; max_years: number | null };
  locations: string[];
  keywords: string[];
  excluded_keywords: string[];
  frequency: "daily";
};
export type Match = {
  id: string;
  job_id: string;
  match_level: "strong" | "good" | "possible";
  status: string;
  matched_at: string;
  job: { title: string; company_name: string; location: string; source: string; job_url: string; discovered_at: string; published_at?: string };
};
export type Connection = { provider: string; available: boolean; connected: boolean; enabled: boolean };
export type Dashboard = { search_preference: Preference | null; recent_jobs: Match[]; connections: Connection[] };

export async function agentRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localAccessToken();
  const response = await fetch(`/api/agent/${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? "Request failed");
  }
  return response.json() as Promise<T>;
}

export function experienceLabel(value: Preference["experience"]): string {
  if (!value) return "—";
  if (value.min_years === 0 && value.max_years === 0) return "Internship";
  if (value.min_years === 0 && value.max_years === 1) return "Fresher / 0–1 year";
  return value.max_years === null ? `${value.min_years}+ years` : `${value.min_years}–${value.max_years} years`;
}
