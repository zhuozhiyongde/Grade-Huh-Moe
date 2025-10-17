'use client';

import { AuthProvider } from "@/context/AuthContext";
import { OptionsProvider } from "@/context/OptionsContext";
import { ScoreProvider } from "@/context/ScoreContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ScoreProvider>
      <OptionsProvider>
        <AuthProvider>{children}</AuthProvider>
      </OptionsProvider>
    </ScoreProvider>
  );
}
