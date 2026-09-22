import { cookies } from "next/headers";
import SiteHeaderClient from "./site-header-client";

type SiteHeaderProps = {
  active?: "companies" | "jobs" | "resources";
};

export default async function SiteHeader({ active }: SiteHeaderProps) {
  const cookieStore = await cookies();
  const initialAuthenticated = Boolean(cookieStore.get("gauas_access_token")?.value);

  return <SiteHeaderClient active={active} initialAuthenticated={initialAuthenticated} />;
}
