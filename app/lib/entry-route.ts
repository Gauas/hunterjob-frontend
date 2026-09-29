import { agentRequest, Dashboard } from "./agent-client";

export type AccountProfile = {
  first_name?: string;
  last_name?: string;
  gender?: string;
  dob?: string;
};

export class AccountProfileError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function hasCompletedProfile(profile: AccountProfile) {
  return Boolean(profile.first_name && profile.last_name && profile.gender && profile.dob);
}

export async function getAccountProfile(token = ""): Promise<AccountProfile> {
  const response = await fetch("/api/profile", {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (response.status === 401 || response.status === 403) throw new AccountProfileError("Your session has expired. Please sign in again.", response.status);
  if (!response.ok) throw new AccountProfileError("Your profile is unavailable. Please try again.", response.status);
  return response.json() as Promise<AccountProfile>;
}

export async function nextRouteAfterLogin(token = "") {
  const profile = await getAccountProfile(token);
  if (!hasCompletedProfile(profile)) return { destination: "/onboarding", snapshot: null };
  try {
    const dashboard = await agentRequest<Dashboard>("dashboard");
    if (!dashboard.search_preference) return { destination: "/ask", snapshot: null };
    return { destination: "/", snapshot: { dashboard, firstName: profile.first_name ?? "Profile" } };
  } catch {
    // A temporary HunterJob API failure must not send an onboarded user back to onboarding.
    return { destination: "/", snapshot: null };
  }
}
