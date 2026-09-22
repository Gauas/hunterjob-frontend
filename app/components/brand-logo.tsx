import Image from "next/image";
import Link from "next/link";

export default function BrandLogo() {
  return (
    <Link
      aria-label="HunterJob home"
      className="inline-flex items-center"
      href="/"
    >
      <Image
        alt="HunterJob logo"
        className="h-12 w-auto object-contain md:h-14"
        height={264}
        priority
        src="/assets/branding/hunterjob-wordmark.png"
        width={1359}
      />
    </Link>
  );
}
