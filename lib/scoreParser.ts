import type { IsopScores, ScoreBase } from "./api";

const STATIC_GPA: Record<string, number | null> = {
  P: null,
  NP: null,
  EX: null,
  IP: null, // 跨学期课程
  I: null, // 缓考
  W: null,
  // 17级研究生手册
  "A+": 4,
  A: 4,
  "A-": 3.7,
  "B+": 3.3,
  B: 3,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1,
  F: null, // 0
};

const DESCRIPTION: Record<string, string> = {
  P: "通过",
  NP: "未通过",
  EX: "免修",
  IP: "跨学期",
  I: "缓考",
  W: "退课",
};

type CampusTag = {
  __campus?: "main" | "med";
  __termKey?: string;
};

function normalizeCourseTypeName(value: string | undefined): string {
  const trimmed = (value ?? "").replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return "未分类";
  }
  const normalized = trimmed.replace(/必修课/g, "必修").replace(/选修课/g, "选修").trim();
  return normalized || "未分类";
}

function normalizeScoreFromIsop(score: string): string | number {
  if (score === "合格") return "P";
  if (score === "不合格") return "NP";
  if (score === "缓考") return "I";
  if (score === "免修") return "EX";
  const number = Number(score);
  if (Number.isNaN(number)) return score;
  return number;
}

export function checkScore(score: string) {
  const number = Number(score);
  if (!Number.isNaN(number)) {
    return number <= 100.001 && number >= -0.001;
  }
  return STATIC_GPA[score] !== undefined;
}

export function courseGpaFromNormalizedScore(
  score: string | number,
): number | null {
  const number = Number(score);
  if (!Number.isNaN(number)) {
    if (number >= 60) {
      return 4 - (3 * Math.pow(100 - number, 2)) / 1600;
    }
    return null;
  }
  return STATIC_GPA[score] ?? null;
}

export function isSpecialCredit(score: string | number): boolean {
  return score === "P" || score === "EX";
}

export function isFail(score: string | number): boolean {
  return (
    score === "NP" ||
    score === "F" ||
    (!Number.isNaN(Number(score)) && Number(score) < 60)
  );
}

export function isFull(score: string | number): boolean {
  return score === "A+" || Number(score) > 99.995;
}

function shouldCalcCredit(score: string | number): boolean {
  return (
    isSpecialCredit(score) || courseGpaFromNormalizedScore(score) !== null
  );
}

function parseTeacher(line: string | undefined): string {
  if (!line) return "（无教师信息）";
  const parts = line.split(",");
  const teacher = parts[0];
  const res = /^[^-]+-([^$]+)\$([^$]*)\$([^$]*)$/.exec(teacher);
  if (res) {
    return `${res[1]}（${res[2]}）${
      parts.length > 1 ? `等${parts.length}人` : ""
    }`;
  }
  return `${teacher}${parts.length > 1 ? ` 等${parts.length}人` : ""}`;
}

function firstTeacherName(line: string | undefined): string {
  if (!line) return "";
  const parts = line.split(",");
  const teacher = parts[0];
  const res = /^[^-]+-([^$]+)\$[^$]*\$[^$]*$/.exec(teacher);
  if (res) return res[1];
  return "";
}

export type CourseExtra = {
  label: string;
  value: string;
  href?: string;
};

function extraInfos(row: ScoreBase): CourseExtra[] {
  const interestingKeys: Array<
    [
      keyof ScoreBase | "zxjhbh" | "ywmc" | "kctx" | "jxbh" | "bkcjbh" | "xslb",
      CourseExtra,
    ]
  > = [];

  interestingKeys.push([
    "kch",
    {
      label: "课程号",
      value: row.kch,
    },
  ]);
  if ("cjjlfs" in row && row.cjjlfs) {
    interestingKeys.push([
      "cjjlfs" as keyof ScoreBase,
      {
        label: "成绩记录方式",
        value: (row as Record<string, string>).cjjlfs,
      },
    ]);
  }
  if ("hgbz" in row && row.hgbz) {
    interestingKeys.push([
      "hgbz" as keyof ScoreBase,
      {
        label: "合格标志",
        value: (row as Record<string, string>).hgbz,
      },
    ]);
  }
  if ("zxjhbh" in row && (row as Record<string, string>).zxjhbh) {
    const code = (row as Record<string, string>).zxjhbh;
    interestingKeys.push([
      "zxjhbh",
      {
        label: "执行计划编号",
        value: code,
        href: `https://elective.pku.edu.cn/elective2008/edu/pku/stu/elective/controller/courseDetail/getCourseDetail.do?kclx=BK&course_seq_no=${encodeURIComponent(code)}`,
      },
    ]);
  }
  if ("ywmc" in row && (row as Record<string, string>).ywmc) {
    interestingKeys.push([
      "ywmc",
      {
        label: "课程英文名",
        value: (row as Record<string, string>).ywmc,
      },
    ]);
  }
  if ("kctx" in row && (row as Record<string, string>).kctx) {
    interestingKeys.push([
      "kctx",
      {
        label: "课程体系",
        value: (row as Record<string, string>).kctx,
      },
    ]);
  }
  if ("jxbh" in row && (row as Record<string, string>).jxbh) {
    interestingKeys.push([
      "jxbh",
      {
        label: "教学班号",
        value: (row as Record<string, string>).jxbh,
      },
    ]);
  }
  if (row.skjsxm) {
    interestingKeys.push([
      "skjsxm" as keyof ScoreBase,
      {
        label: "教师信息",
        value: row.skjsxm,
      },
    ]);
  }
  if ("bkcjbh" in row && (row as Record<string, string>).bkcjbh) {
    interestingKeys.push([
      "bkcjbh",
      {
        label: "成绩编号",
        value: (row as Record<string, string>).bkcjbh,
      },
    ]);
  }
  if ("xslb" in row && (row as Record<string, string>).xslb) {
    interestingKeys.push([
      "xslb",
      {
        label: "学生类别",
        value: (row as Record<string, string>).xslb,
      },
    ]);
  }

  return interestingKeys
    .map(([, extra]) => extra)
    .filter((extra) => extra.value && extra.value.trim().length > 0);
}

export type Course = {
  readonly id: string;
  readonly name: string;
  readonly type: string;

  readonly year: number;
  readonly semester: number;
  readonly semName: string;
  readonly semNameOriginal: string | undefined;
  readonly termKey: string;

  readonly credit: number;
  score: string | number;
  readonly trueScore: string | number;
  readonly isopGpa: string | null;

  readonly details: string;
  readonly extras: CourseExtra[];

  readonly firstTeacher: string;
  readonly campus: "main" | "med" | "unknown";
};

export type Semester = {
  name: string;
  year: number;
  semester: number;
  courseList: number[];
};

export type ParseResult = {
  semesters: Semester[];
  courses: Course[];
  isopGpa: string | null;
};

export function parseScore(json: IsopScores): ParseResult {
  interface UnifiedScore {
    raw: ScoreBase & Record<string, string>;
    score: string;
    type: string;
  }

  let rows: UnifiedScore[];
  if (json.xslb === "yjs") {
    rows = json.scoreLists.map((r) => ({
      raw: r as ScoreBase & Record<string, string>,
      score: r.cj,
      type: normalizeCourseTypeName((r as ScoreBase & Record<string, string>).kclb),
    }));
  } else {
    rows = json.cjxx.map((r) => ({
      raw: r as ScoreBase & Record<string, string>,
      score: r.xqcj,
      type: normalizeCourseTypeName((r as ScoreBase & Record<string, string>).kclbmc),
    }));
  }

  const courses = rows.map(({ raw, score, type }) => {
    const normalizedScore = normalizeScoreFromIsop(score);
    const teacherSummary = parseTeacher(raw.skjsxm);
    const details = type + (teacherSummary ? ` - ${teacherSummary}` : "");
    const campus = detectCampus(json, raw);
    const termKey = resolveTermKey(raw);
    return {
      id: raw.kch,
      name: raw.kcmc,
      type,
      year: Number.parseInt(raw.xnd, 10),
      semester: Number.parseInt(raw.xq, 10),
      semName: `${raw.xnd}-${raw.xq}`,
      semNameOriginal: raw.xndxqpx,
      termKey,
      credit: Number.parseFloat(raw.xf),
      score: normalizedScore,
      trueScore: normalizedScore,
      isopGpa:
        raw.jd ??
        courseGpaFromNormalizedScore(normalizedScore)?.toString() ??
        null,
      details,
      extras: extraInfos(raw),
      firstTeacher: firstTeacherName(raw.skjsxm),
      campus,
    } satisfies Course;
  });

  const semesters: Record<string, Semester> = {};
  courses.forEach((course, idx) => {
    const semKey = course.semName;
    if (!semesters[semKey]) {
      semesters[semKey] = {
        name: `${Number.isNaN(course.year) ? "--" : course.year}学年 第${
          Number.isNaN(course.semester) ? "--" : course.semester
        }学期`,
        year: course.year,
        semester: course.semester,
        courseList: [],
      };
    }
    semesters[semKey].courseList.push(idx);
  });

  const semestersArr = Object.values(semesters).sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.semester - a.semester;
  });

  return {
    courses,
    isopGpa: json.xslb === "yjs" ? null : json.gpa.gpa,
    semesters: semestersArr,
  };
}

function detectCampus(
  json: IsopScores,
  raw: ScoreBase & Record<string, string>,
): "main" | "med" | "unknown" {
  const tag = (raw as unknown as CampusTag).__campus;
  if (tag === "main" || tag === "med") {
    return tag;
  }
  if (json.xslb === "bks") {
    return "main";
  }
  return "unknown";
}

function resolveTermKey(raw: ScoreBase & Record<string, string>): string {
  const tagged = (raw as unknown as CampusTag).__termKey;
  if (tagged && tagged.trim().length > 0) {
    return tagged.trim();
  }
  const computed = buildTermKeyFromRaw(raw.xnd, raw.xq, raw.xndxqpx);
  if (computed.trim().length > 0) {
    return computed.trim();
  }
  const fallback = `${raw.xnd}-${raw.xq}`;
  return fallback.trim().length > 0 ? fallback : "unknown";
}

function buildTermKeyFromRaw(
  xnd: string | undefined,
  xq: string | undefined,
  original: string | undefined,
): string {
  const range = normalizeAcademicYearRange(xnd, original);
  const semester = extractSemester(xq, original);
  if (range && semester) {
    return `${range}-${semester}`;
  }
  if (range) {
    return range;
  }
  if (semester) {
    return semester;
  }
  return "";
}

function normalizeAcademicYearRange(
  xnd: string | undefined,
  fallback: string | undefined,
): string | null {
  const trimmed = (xnd ?? "").trim();
  if (/^\d{4}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{4}$/.test(trimmed)) {
    const start = Number.parseInt(trimmed, 10);
    return Number.isNaN(start) ? trimmed : `${start}-${start + 1}`;
  }
  const startYear =
    extractStartYear(trimmed) ?? extractStartYear((fallback ?? "").trim());
  if (startYear === null) {
    return trimmed || (fallback ?? "") || null;
  }
  return `${startYear}-${startYear + 1}`;
}

function extractSemester(xq: string | undefined, fallback: string | undefined): string {
  const direct = (xq ?? "").trim();
  if (direct) {
    return direct;
  }
  if (!fallback) {
    return "";
  }
  const matched = /第\s*(\d)\s*学期/.exec(fallback);
  if (matched) {
    return matched[1];
  }
  const digits = fallback.match(/\d+/);
  if (digits && digits[0]) {
    return digits[0];
  }
  return "";
}

function extractStartYear(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const fourDigit = trimmed.match(/\d{4}/);
  if (fourDigit && fourDigit[0]) {
    return Number.parseInt(fourDigit[0], 10);
  }
  const twoDigit = trimmed.match(/\d{2}/);
  if (twoDigit && twoDigit[0]) {
    const parsed = Number.parseInt(twoDigit[0], 10);
    if (!Number.isNaN(parsed)) {
      return parsed >= 90 ? 1900 + parsed : 2000 + parsed;
    }
  }
  return null;
}

export function calcGpa(
  courses: Course[],
  idxs?: readonly number[],
): number | null {
  let totCredit = 0;
  let totGpa = 0;
  const indexList = idxs ?? courses.map((_, idx) => idx);
  indexList.forEach((idx) => {
    const course = courses[idx];
    const gpa = courseGpaFromNormalizedScore(course.score);
    if (gpa !== null) {
      totCredit += course.credit;
      totGpa += course.credit * gpa;
    }
  });
  if (totCredit) return totGpa / totCredit;
  return null;
}

export function sumCredit(
  courses: Course[],
  idxs?: readonly number[],
): number {
  let totCredit = 0;
  const indexList = idxs ?? courses.map((_, idx) => idx);
  indexList.forEach((idx) => {
    if (shouldCalcCredit(courses[idx].score)) {
      totCredit += courses[idx].credit;
    }
  });
  return totCredit;
}

const SQRT3 = Math.sqrt(3);

export function guessScoreFromGpa(gpa: number | null): number | string {
  if (gpa === null) return "--.-";
  if (gpa >= 4) return 100;
  if (gpa >= 1) {
    return (-40 * SQRT3 * Math.sqrt(4 - gpa) + 300) / 3;
  }
  return "--.-";
}

export function fix(num: string | number, dig: number) {
  if (typeof num !== "number") return num;
  const s = num.toFixed(dig);
  return s.replace(/^(.*?)0+$/, "$1").replace(/\.$/, "");
}

export function describe(score: string | number) {
  return DESCRIPTION[score] || "-.--";
}

export function scoreTampered(courses: Course[]) {
  return courses.some((course) => `${course.score}` !== `${course.trueScore}`);
}
