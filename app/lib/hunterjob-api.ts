import "server-only";

const DEFAULT_API_BASE_URL = "https://api.gauas.com";
const REQUEST_TIMEOUT_MS = 10_000;

export type JobLocation = {
  city: string;
  country: string;
  remote: boolean;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  locations: JobLocation[];
  levels: string[];
  employment_type: string;
  experience: { min_years: number; max_years: number };
  skills: string[];
  last_seen_at: string;
  original_url: string;
};

export type JobFilters = {
  active?: boolean;
  keyword?: string;
  level?: string;
  limit?: number;
  location?: string;
  page?: number;
  remote?: boolean;
};

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

type APIEnvelope<T> = { data: T; meta?: PageMeta };

export type APIResult<T> =
  | { data: T; error: null; meta?: PageMeta }
  | { data: null; error: string; meta?: undefined };

function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

async function get<T>(path: string, revalidate?: number): Promise<APIResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      next: revalidate === undefined ? undefined : { revalidate },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { data: null, error: "HunterJob is temporarily unavailable." };
  }
  if (!response.ok) return { data: null, error: "HunterJob is temporarily unavailable." };
  const payload = await response.json().catch(() => null) as APIEnvelope<T> | null;
  if (payload === null) return { data: null, error: "HunterJob returned an invalid response." };
  return { data: payload.data, error: null, meta: payload.meta };
}

export async function listJobs(filters: JobFilters = {}) {
  const params = new URLSearchParams();
  addParam(params, "active", filters.active);
  addParam(params, "keyword", filters.keyword);
  addParam(params, "level", filters.level);
  addParam(params, "limit", filters.limit);
  addParam(params, "location", filters.location);
  addParam(params, "page", filters.page);
  addParam(params, "remote", filters.remote);
  const query = params.size === 0 ? "" : `?${params.toString()}`;
  return get<Job[]>(`/api/v1/jobs${query}`, 60);
}

export async function latestJobs(limit = 5) {
  return get<Job[]>(`/api/v1/jobs/latest?limit=${limit}`, 60);
}

export async function getJob(id: string) {
  return get<Job>(`/api/v1/jobs/${encodeURIComponent(id)}`);
}

export function applicationRedirectUrl(id: string) {
  return `${apiBaseUrl()}/api/v1/jobs/${encodeURIComponent(id)}/redirect`;
}

function addParam(params: URLSearchParams, key: string, value: boolean | number | string | undefined) {
  if (value === undefined || value === "") return;
  params.set(key, String(value));
}
