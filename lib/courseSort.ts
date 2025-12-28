import { Course, courseGpaFromNormalizedScore, isFail } from "./scoreParser";

function normalizeYearForSort(year: number): number {
  if (Number.isNaN(year)) return Number.NEGATIVE_INFINITY;
  if (year >= 1900 || year <= -1900) return year;
  if (year >= 0 && year < 100) return year >= 90 ? 1900 + year : 2000 + year;
  if (year <= 0 && year > -100) {
    const abs = Math.abs(year);
    return abs >= 90 ? 1900 - abs : 2000 - abs;
  }
  return year;
}

function normalizeSemesterForSort(semester: number): number {
  if (Number.isNaN(semester)) return Number.NEGATIVE_INFINITY;
  return semester;
}

function compareCourseIndices(courses: Course[], aIdx: number, bIdx: number): number {
  const a = courses[aIdx];
  const b = courses[bIdx];
  if (!a || !b) return 0;

  const yearA = normalizeYearForSort(a.year);
  const yearB = normalizeYearForSort(b.year);
  if (yearA !== yearB) return yearB - yearA;

  const semA = normalizeSemesterForSort(a.semester);
  const semB = normalizeSemesterForSort(b.semester);
  if (semA !== semB) return semB - semA;

  const gpaA = courseGpaFromNormalizedScore(a.score) ?? Number.NEGATIVE_INFINITY;
  const gpaB = courseGpaFromNormalizedScore(b.score) ?? Number.NEGATIVE_INFINITY;
  if (gpaA !== gpaB) return gpaB - gpaA;

  const failA = Number(isFail(a.score));
  const failB = Number(isFail(b.score));
  if (failA !== failB) return failB - failA;

  return bIdx - aIdx;
}

export function sortCourseIndices(courses: Course[], indices: Iterable<number>): number[] {
  return Array.from(indices).sort((a, b) => compareCourseIndices(courses, a, b));
}
