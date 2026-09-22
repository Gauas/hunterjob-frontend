import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HunterJob | Official career opportunities",
  description: "Discover jobs from official company career pages.",
  icons: {
    icon: "/assets/branding/hunterjob-icon.png",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
