'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ApiResult } from "@/lib/api";
import { checkScore, Course, parseScore, ParseResult } from "@/lib/scoreParser";
import { sortCourseIndices } from "@/lib/courseSort";

type ScoreContextValue = {
  result: ParseResult | null;
  loading: boolean;
  lastUpdated: Date | null;
  newBlocks: number[];
  hasData: boolean;
  loadScores: (fetcher: () => Promise<ApiResult>) => Promise<void>;
  clear: () => void;
  tamper: (index: number, value: string) => void;
  untamper: (index: number) => void;
  dismissNewBlock: () => void;
};

const ScoreContext = createContext<ScoreContextValue | undefined>(undefined);

const STORAGE_KEY = "SCORE_SHOWN";

function readShownCourseIds(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
    return [];
  } catch (error) {
    console.error("Failed to read stored course ids", error);
    return [];
  }
}

function writeShownCourseIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error("Failed to persist course ids", error);
  }
}

export function ScoreProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newBlocks, setNewBlocks] = useState<number[]>([]);

  const shownRef = useRef<string[]>([]);
  const pendingShownRef = useRef<string[] | null>(null);

  const ensureShownLoaded = useCallback(() => {
    if (shownRef.current.length === 0) {
      shownRef.current = readShownCourseIds();
    }
  }, []);

  const updateNewBlocks = useCallback((courses: Course[]) => {
    ensureShownLoaded();
    const shown = shownRef.current;
    const allIds = courses.map((course) => course.id);
    pendingShownRef.current = allIds;

    if (shown.length === 0) {
      shownRef.current = allIds;
      writeShownCourseIds(allIds);
      setNewBlocks([]);
      return;
    }

    const unseen = courses
      .map((course, index) => (shown.includes(course.id) ? null : index))
      .filter((index): index is number => index !== null);

    const sorted = sortCourseIndices(courses, unseen);
    setNewBlocks(sorted);
  }, [ensureShownLoaded]);

  const applyPendingShown = useCallback(() => {
    if (pendingShownRef.current) {
      shownRef.current = pendingShownRef.current;
      writeShownCourseIds(pendingShownRef.current);
    }
  }, []);

  const loadScores = useCallback(
    async (fetcher: () => Promise<ApiResult>) => {
      setLoading(true);
      try {
        const json = await fetcher();
        if (!json.success) {
          throw new Error(json.errMsg ?? "获取成绩失败");
        }

        const parsed = parseScore(json);
        setResult(parsed);
        setLastUpdated(new Date());
        updateNewBlocks(parsed.courses);
      } finally {
        setLoading(false);
      }
    },
    [updateNewBlocks],
  );

  const clear = useCallback(() => {
    setResult(null);
    setNewBlocks([]);
  }, []);

  const tamper = useCallback((index: number, value: string) => {
    setResult((prev) => {
      if (!prev) return prev;
      if (!checkScore(value)) return prev;
      const nextCourses = [...prev.courses];
      const course = nextCourses[index];
      if (!course) return prev;
      nextCourses[index] = { ...course, score: value.toUpperCase() };
      return {
        ...prev,
        courses: nextCourses,
      };
    });
  }, []);

  const untamper = useCallback((index: number) => {
    setResult((prev) => {
      if (!prev) return prev;
      const nextCourses = [...prev.courses];
      const course = nextCourses[index];
      if (!course) return prev;
      nextCourses[index] = { ...course, score: course.trueScore };
      return {
        ...prev,
        courses: nextCourses,
      };
    });
  }, []);

  const dismissNewBlock = useCallback(() => {
    applyPendingShown();
    setNewBlocks([]);
  }, [applyPendingShown]);

  const value = useMemo<ScoreContextValue>(
    () => ({
      result,
      loading,
      lastUpdated,
      newBlocks,
      hasData: result !== null,
      loadScores,
      clear,
      tamper,
      untamper,
      dismissNewBlock,
    }),
    [clear, dismissNewBlock, lastUpdated, loadScores, loading, newBlocks, result, tamper, untamper],
  );

  return <ScoreContext.Provider value={value}>{children}</ScoreContext.Provider>;
}

export function useScoreContext() {
  const context = useContext(ScoreContext);
  if (!context) {
    throw new Error("useScoreContext must be used within a ScoreProvider");
  }
  return context;
}
