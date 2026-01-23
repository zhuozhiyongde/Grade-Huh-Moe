'use client';

import { AuthProvider } from "@/context/AuthContext";
import { GradePresetProvider } from "@/context/GradePresetContext";
import { OptionsProvider } from "@/context/OptionsContext";
import { ScoreProvider } from "@/context/ScoreContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ScoreProvider>
      <GradePresetProvider>
        <OptionsProvider>
          <AuthProvider>{children}</AuthProvider>
        </OptionsProvider>
      </GradePresetProvider>
    </ScoreProvider>
  );
}
