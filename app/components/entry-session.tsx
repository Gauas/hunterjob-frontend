"use client";

import { createContext, useContext, useState } from "react";
import { Dashboard } from "../lib/agent-client";

type EntrySnapshot = { dashboard: Dashboard; firstName: string };
type EntrySession = {
  snapshot: EntrySnapshot | null;
  setSnapshot: (snapshot: EntrySnapshot | null) => void;
};

const EntrySessionContext = createContext<EntrySession | null>(null);

export function EntrySessionProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<EntrySnapshot | null>(null);
  return <EntrySessionContext.Provider value={{ snapshot, setSnapshot }}>{children}</EntrySessionContext.Provider>;
}

export function useEntrySession() {
  const session = useContext(EntrySessionContext);
  if (!session) throw new Error("EntrySessionProvider is missing");
  return session;
}
