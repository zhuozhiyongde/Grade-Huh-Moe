'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ScoreMode = "main" | "med" | "mixed";
export type SemesterMixMode = "merge" | "split";

type OptionsContextValue = {
  hideText: boolean;
  judgeByGpa: boolean;
  mode: ScoreMode;
  semesterMixMode: SemesterMixMode;
  collapseAllSemesters: boolean;
  toggleHideText: () => void;
  toggleJudgeByGpa: () => void;
  setMode: (mode: ScoreMode) => void;
  setSemesterMixMode: (mode: SemesterMixMode) => void;
  toggleCollapseAllSemesters: () => void;
};

const OptionsContext = createContext<OptionsContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  hideText: "OPTION_HIDE_TEXT",
  judgeByGpa: "OPTION_JUDGE_BY_GPA",
  mode: "OPTION_SCORE_MODE",
  semesterMixMode: "OPTION_SEMESTER_MIX_MODE",
  collapseAllSemesters: "OPTION_COLLAPSE_ALL_SEMESTERS",
} as const;

export function OptionsProvider({ children }: { children: React.ReactNode }) {
  const [hideText, setHideText] = useState(false);
  const [judgeByGpa, setJudgeByGpa] = useState(false);
  const [mode, setModeState] = useState<ScoreMode>("main");
  const [semesterMixMode, setSemesterMixModeState] = useState<SemesterMixMode>("split");
  const [collapseAllSemesters, setCollapseAllSemesters] = useState(false);

  useEffect(() => {
    try {
      const storedHide = localStorage.getItem(STORAGE_KEYS.hideText);
      const storedJudge = localStorage.getItem(STORAGE_KEYS.judgeByGpa);
      const storedMode = localStorage.getItem(STORAGE_KEYS.mode);
      const storedMixMode = localStorage.getItem(STORAGE_KEYS.semesterMixMode);
      const storedCollapse = localStorage.getItem(STORAGE_KEYS.collapseAllSemesters);
      if (storedHide !== null) {
        setHideText(storedHide === "1");
      }
      if (storedJudge !== null) {
        setJudgeByGpa(storedJudge === "1");
      }
      if (storedMode === "med" || storedMode === "mixed" || storedMode === "main") {
        setModeState(storedMode);
      }
      if (storedMixMode === "merge" || storedMixMode === "split") {
        setSemesterMixModeState(storedMixMode);
      }
      if (storedCollapse !== null) {
        setCollapseAllSemesters(storedCollapse === "1");
      }
    } catch (error) {
      console.error("Failed to read options from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.hideText, hideText ? "1" : "0");
    } catch (error) {
      console.error("Failed to persist hideText", error);
    }
  }, [hideText]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.judgeByGpa, judgeByGpa ? "1" : "0");
    } catch (error) {
      console.error("Failed to persist judgeByGpa", error);
    }
  }, [judgeByGpa]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.mode, mode);
    } catch (error) {
      console.error("Failed to persist score mode", error);
    }
  }, [mode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.semesterMixMode, semesterMixMode);
    } catch (error) {
      console.error("Failed to persist semester mix mode", error);
    }
  }, [semesterMixMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.collapseAllSemesters, collapseAllSemesters ? "1" : "0");
    } catch (error) {
      console.error("Failed to persist collapse all semesters", error);
    }
  }, [collapseAllSemesters]);

  const toggleHideText = useCallback(() => {
    setHideText((prev) => !prev);
  }, []);

  const toggleJudgeByGpa = useCallback(() => {
    setJudgeByGpa((prev) => !prev);
  }, []);

  const setMode = useCallback((nextMode: ScoreMode) => {
    setModeState(nextMode);
  }, []);

  const setSemesterMixMode = useCallback((nextMode: SemesterMixMode) => {
    setSemesterMixModeState(nextMode);
  }, []);

  const toggleCollapseAllSemesters = useCallback(() => {
    setCollapseAllSemesters((prev) => !prev);
  }, []);

  const value = useMemo<OptionsContextValue>(
    () => ({
      hideText,
      judgeByGpa,
      mode,
      semesterMixMode,
      collapseAllSemesters,
      toggleHideText,
      toggleJudgeByGpa,
      setMode,
      setSemesterMixMode,
      toggleCollapseAllSemesters,
    }),
    [
      hideText,
      judgeByGpa,
      mode,
      semesterMixMode,
      collapseAllSemesters,
      setMode,
      setSemesterMixMode,
      toggleHideText,
      toggleJudgeByGpa,
      toggleCollapseAllSemesters,
    ],
  );

  return <OptionsContext.Provider value={value}>{children}</OptionsContext.Provider>;
}

export function useOptions() {
  const context = useContext(OptionsContext);
  if (!context) {
    throw new Error("useOptions must be used within an OptionsProvider");
  }
  return context;
}
