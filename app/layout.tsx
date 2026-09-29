import "./globals.css";

import type { Metadata } from "next";
import { EntrySessionProvider } from "./components/entry-session";

export const metadata: Metadata = {
  title: "HunterJob | Your personal job agent",
  description: "Get jobs matched to your preferences and delivered to your chat apps.",
  icons: {
    icon: "/assets/branding/hunterjob-icon.png",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><EntrySessionProvider>{children}</EntrySessionProvider></body>
    </html>
  );
}
