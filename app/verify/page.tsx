import { cookies } from "next/headers";
import VerificationPage from "../components/verification-page";

export default async function VerifyPage() {
  const cookieStore = await cookies();
  return <VerificationPage email={cookieStore.get("gauas_verification_email")?.value ?? ""} />;
}
