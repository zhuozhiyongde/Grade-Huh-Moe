'use client';

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOptions } from "@/context/OptionsContext";
import { useScoreContext } from "@/context/ScoreContext";
import { RelativeTime } from "@/components/RelativeTime";
import { NewBlockCard } from "@/components/viewer/NewBlockCard";
import { SemesterSection } from "@/components/viewer/SemesterSection";
import { OverallSection } from "@/components/viewer/OverallSection";
import type { Course } from "@/lib/scoreParser";

export function Viewer() {
  const { load, loading } = useAuth();
  const { hideText, judgeByGpa, semesterMixMode } = useOptions();
  const { result, lastUpdated, newBlocks, tamper, untamper, dismissNewBlock } = useScoreContext();

  const hasNewBlock = newBlocks.length > 0;
  const courses = useMemo(() => result?.courses ?? [], [result]);
  const semesters = useMemo(() => {
    if (!result) return [];
    if (semesterMixMode !== "merge") {
      return result.semesters;
    }

    type AggregatedSemester = {
      name: string;
      year: number;
      semester: number;
      courseList: number[];
      sortYear: number;
      sortSemester: number;
    };

    const groups = new Map<string, AggregatedSemester>();

    courses.forEach((course, index) => {
      const key = (course.termKey || course.semName || "").trim() || `${course.semName}`;
      const normalizedKey = key;
      const info = deriveSemesterInfo(course, normalizedKey);
      const existing = groups.get(normalizedKey);
      if (!existing) {
        groups.set(normalizedKey, {
          name: info.displayName,
          year: Number.isNaN(info.sortYear) ? normalizeDisplayYear(course.year) : info.sortYear,
          semester: Number.isNaN(info.sortSemester) ? course.semester : info.sortSemester,
          courseList: [index],
          sortYear: info.sortYear,
          sortSemester: info.sortSemester,
        });
      } else {
        existing.courseList.push(index);
        existing.name = pickBetterName(existing.name, info.displayName);
        existing.sortYear = pickBetterSort(existing.sortYear, info.sortYear);
        existing.sortSemester = pickBetterSort(existing.sortSemester, info.sortSemester);
        if (Number.isNaN(existing.year)) {
          existing.year = Number.isNaN(info.sortYear) ? normalizeDisplayYear(course.year) : info.sortYear;
        }
        if (Number.isNaN(existing.semester)) {
          existing.semester = Number.isNaN(info.sortSemester) ? course.semester : info.sortSemester;
        }
      }
    });

    // Helps debug semester mixing by showing how courses are bucketed.
    const debugGroups = Array.from(groups.entries()).map(([key, value]) => ({
      key,
      name: value.name,
      sortYear: value.sortYear,
      sortSemester: value.sortSemester,
      courseIds: value.courseList.map((idx) => {
        const course = courses[idx];
        return {
          idx,
          courseName: course.name,
          campus: course.campus,
          termKey: course.termKey,
          semName: course.semName,
          semNameOriginal: course.semNameOriginal,
          year: course.year,
          semester: course.semester,
        };
      }),
    }));
    if (typeof window !== "undefined") {
      const holder = window as typeof window & {
        __PKU_SEMESTER_MIX_DEBUG__?: typeof debugGroups;
      };
      holder.__PKU_SEMESTER_MIX_DEBUG__ = debugGroups;
    }
    // eslint-disable-next-line no-console
    console.log("[semester-mix][merge] groups", debugGroups);

    const aggregated = Array.from(groups.values());
    aggregated.sort((a, b) => {
      const yearA = Number.isNaN(a.sortYear) ? -Infinity : a.sortYear;
      const yearB = Number.isNaN(b.sortYear) ? -Infinity : b.sortYear;
      if (yearA !== yearB) {
        return yearB - yearA;
      }
      const semA = Number.isNaN(a.sortSemester) ? -Infinity : a.sortSemester;
      const semB = Number.isNaN(b.sortSemester) ? -Infinity : b.sortSemester;
      if (semA !== semB) {
        return semB - semA;
      }
      return b.courseList.length - a.courseList.length;
    });

    return aggregated.map(({ name, year, semester, courseList }) => ({
      name,
      year,
      semester,
      courseList,
    }));
  }, [courses, result, semesterMixMode]);

  if (!result) {
    return null;
  }

  return (
    <div>
      <p className="refresh-time-line print-hide flex justify-center">
        <button
          type="button"
          onClick={() => {
            void load();
          }}
          className="controller-link"
          disabled={loading}
        >
          <span className="icon icon-reload" />
          {loading ? "刷新中…" : "刷新"}
        </button>
        {" "}
        <RelativeTime
          value={lastUpdated}
          suffix=" 更新"
          fallback="尚未更新"
          refreshIntervalMs={60_000}
        />
      </p>
      <div className="viewer">
        {hasNewBlock && (
          <NewBlockCard
            courses={courses}
            newIndices={newBlocks}
            hideText={hideText}
            judgeByGpa={judgeByGpa}
            onDismiss={dismissNewBlock}
            onTamper={tamper}
            onUntamper={untamper}
          />
        )}
        {semesters.map((semester, index) => (
          <SemesterSection
            key={`${semester.year}-${semester.semester}-${index}`}
            semester={semester}
            courses={courses}
            hideText={hideText}
            judgeByGpa={judgeByGpa}
            onTamper={tamper}
            onUntamper={untamper}
          />
        ))}
        <OverallSection
          courses={courses}
          isopGpa={result.isopGpa}
          hideText={hideText}
          judgeByGpa={judgeByGpa}
        />
      </div>
    </div>
  );
}

function sanitizeSemesterName(course: Course): string {
  if (course.semNameOriginal && course.semNameOriginal.trim().length > 0) {
    return course.semNameOriginal.replace(/\s+/g, " ").trim();
  }
  const yearDisplay = Number.isNaN(course.year) ? "--" : course.year;
  const semesterDisplay = Number.isNaN(course.semester)
    ? "--"
    : course.semester;
  return `${yearDisplay}学年 第${semesterDisplay}学期`;
}

function normalizeYearForSort(key: string, fallbackYear: number): number {
  const match = key.match(/\b(\d{4})\b/);
  if (match) {
    return Number.parseInt(match[1], 10);
  }
  const normalizedFallback = normalizeDisplayYear(fallbackYear);
  if (!Number.isNaN(normalizedFallback)) {
    return normalizedFallback;
  }
  const shortMatch = key.match(/\b(\d{2})\b/);
  if (shortMatch) {
    const parsed = Number.parseInt(shortMatch[1], 10);
    if (!Number.isNaN(parsed)) {
      return parsed >= 90 ? 1900 + parsed : 2000 + parsed;
    }
  }
  return Number.NaN;
}

function normalizeSemesterForSort(key: string, fallbackSemester: number): number {
  if (!Number.isNaN(fallbackSemester)) {
    return fallbackSemester;
  }
  const endMatch = key.match(/-(\d)\s*$/);
  if (endMatch) {
    return Number.parseInt(endMatch[1], 10);
  }
  const digits = key.match(/\d+/g);
  if (digits && digits.length > 0) {
    return Number.parseInt(digits[digits.length - 1], 10);
  }
  return Number.NaN;
}

function pickBetterSort(current: number, candidate: number): number {
  if (Number.isNaN(current)) {
    return candidate;
  }
  if (Number.isNaN(candidate)) {
    return current;
  }
  return Math.max(current, candidate);
}

type ParsedTerm = {
  displayName: string;
  sortYear: number;
  sortSemester: number;
};

function deriveSemesterInfo(course: Course, key: string): ParsedTerm {
  const fromTermKey = parseTermText(course.termKey ?? "");
  if (fromTermKey) {
    return fromTermKey;
  }

  const fromOriginal = parseTermText(course.semNameOriginal ?? "");
  if (fromOriginal) {
    return fromOriginal;
  }

  const fallbackName = sanitizeSemesterName(course);
  return {
    displayName: fallbackName,
    sortYear: normalizeYearForSort(key, course.year),
    sortSemester: normalizeSemesterForSort(key, course.semester),
  };
}

function parseTermText(value: string): ParsedTerm | null {
  const trimmed = value.replace(/[（）]/g, " ").trim();
  if (!trimmed) {
    return null;
  }

  const directMatch = trimmed.match(/(\d{2,4})\s*-\s*(\d{2,4})(?:\s*-\s*(\d+))?/);
  if (directMatch) {
    const startYear = normalizeYearToken(directMatch[1]);
    const semesterToken = directMatch[3];
    const semester =
      semesterToken !== undefined ? normalizeSemesterToken(semesterToken) : extractSemesterNumber(trimmed);
    return buildParsedTerm(startYear, semester);
  }

  const startYear = extractStartYear(trimmed);
  const semester = extractSemesterNumber(trimmed);
  if (startYear !== null || semester !== null) {
    return buildParsedTerm(startYear, semester);
  }

  return null;
}

function buildParsedTerm(startYear: number | null, semester: number | null): ParsedTerm {
  return {
    displayName: formatTermDisplay(startYear, semester),
    sortYear: startYear ?? Number.NaN,
    sortSemester: semester ?? Number.NaN,
  };
}

function formatTermDisplay(startYear: number | null, semester: number | null): string {
  const yearDisplay = startYear === null ? "--" : toTwoDigitDisplay(startYear);
  const semesterDisplay = semester === null ? "--" : `${semester}`;
  return `${yearDisplay}学年 第${semesterDisplay}学期`;
}

function toTwoDigitDisplay(year: number): string {
  const normalized = Math.trunc(year);
  const mod = normalized % 100;
  const positive = mod >= 0 ? mod : mod + 100;
  return positive.toString().padStart(2, "0");
}

function extractStartYear(value: string): number | null {
  const range = value.match(/(\d{2,4})\s*-\s*(\d{2,4})/);
  if (range) {
    return normalizeYearToken(range[1]);
  }
  const label = value.match(/(\d{2,4})\s*学年/);
  if (label) {
    return normalizeYearToken(label[1]);
  }
  const fourDigit = value.match(/(\d{4})/);
  if (fourDigit) {
    return normalizeYearToken(fourDigit[1]);
  }
  return null;
}

function extractSemesterNumber(value: string): number | null {
  const labeled = value.match(/第\s*(\d)\s*学期/);
  if (labeled) {
    return normalizeSemesterToken(labeled[1]);
  }
  const simple = value.match(/(\d)\s*学期/);
  if (simple) {
    return normalizeSemesterToken(simple[1]);
  }
  const suffix = value.match(/-(\d)\s*$/);
  if (suffix) {
    return normalizeSemesterToken(suffix[1]);
  }
  const tokens = value.split(/[^0-9]+/).filter((token) => token.length > 0);
  if (tokens.length >= 1) {
    const candidate = normalizeSemesterToken(tokens[tokens.length - 1]);
    if (candidate !== null) {
      return candidate;
    }
  }
  return null;
}

function normalizeYearToken(token: string): number | null {
  const trimmed = token.trim();
  if (!trimmed) {
    return null;
  }
  const numeric = Number.parseInt(trimmed, 10);
  if (Number.isNaN(numeric)) {
    return null;
  }
  if (trimmed.length >= 4) {
    return numeric;
  }
  if (trimmed.length === 2) {
    return numeric >= 90 ? 1900 + numeric : 2000 + numeric;
  }
  return numeric;
}

function normalizeSemesterToken(token: string): number | null {
  const numeric = Number.parseInt(token.trim(), 10);
  if (Number.isNaN(numeric)) {
    return null;
  }
  if (numeric >= 0 && numeric <= 20) {
    return numeric;
  }
  return null;
}

function pickBetterName(current: string, candidate: string): string {
  const trimmedCurrent = current.trim();
  const trimmedCandidate = candidate.trim();
  if (!trimmedCandidate) {
    return trimmedCurrent;
  }
  if (!trimmedCurrent) {
    return trimmedCandidate;
  }
  const containsAcademic = (value: string) => /学年/.test(value);
  if (containsAcademic(trimmedCandidate) && !containsAcademic(trimmedCurrent)) {
    return trimmedCandidate;
  }
  if (trimmedCandidate.length > trimmedCurrent.length) {
    return trimmedCandidate;
  }
  return trimmedCurrent;
}

function normalizeDisplayYear(year: number): number {
  if (Number.isNaN(year)) {
    return Number.NaN;
  }
  if (year >= 1900 || year <= -1900) {
    return year;
  }
  if (year >= 0 && year < 100) {
    return year >= 90 ? 1900 + year : 2000 + year;
  }
  if (year <= 0 && year > -100) {
    const abs = Math.abs(year);
    return abs >= 90 ? 1900 - abs : 2000 - abs;
  }
  return year;
}
