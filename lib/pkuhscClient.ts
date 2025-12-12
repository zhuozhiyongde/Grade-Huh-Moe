'use client';

import type { ApiResult, BksScores } from '@/lib/api';
import { calcGpa, parseScore } from '@/lib/scoreParser';

const BACKEND_URL = 'https://grade-backend.arthals.ink';
// const BACKEND_URL: string = 'http://localhost:24702';
const PKUHSC_ENDPOINT = '/api/pkuhsc';

type MedClientParams = {
    username: string;
    password: string;
    excludeMainCampus: boolean;
    gid?: string;
};

export type MedGidResult =
    | {
          success: true;
          gid: string;
      }
    | {
          success: false;
          errMsg: string;
      };

type MedGidParams = {
    username: string;
    password: string;
};

type MedScoreRow = {
    XNXQDM?: string;
    XNXQDM_DISPLAY?: string;
    KKDWDM_DISPLAY?: string;
    XSKCH?: string;
    KCH?: string;
    KXH?: string;
    XSKCM?: string;
    KCM?: string;
    XF?: string | number | null;
    XFJD?: string | number | null;
    WID?: string;
    ZCJ?: string | number | null;
    QMCJ?: string | number | null;
    SYCJ?: string | number | null;
    QMCJXS?: string | number | null;
    SYCJ_DISPLAY?: string | number | null;
    ZCJ_DISPLAY?: string | number | null;
    DJCJMC?: string | null;
    DJCJLXDM_DISPLAY?: string | null;
    DJCJLXDM?: string | null;
    KCLBDM_DISPLAY?: string | null;
    KCLBDM?: string | null;
    KCXZDM_DISPLAY?: string | null;
    KCXZDM?: string | null;
    KSSJ?: string | null;
    JXBID?: string | null;
    TSYYDM?: string | number | null;
    TSYYDM_DISPLAY?: string | null;
    XDFSDM?: string | null;
    XDFSDM_DISPLAY?: string | null;
};

type MedQueryResponse = {
    code?: string | number;
    datas?: {
        xscjcx?: {
            rows?: MedScoreRow[];
        };
    };
};

const PASS_FAIL_MAP: Record<string, string> = {
    通过: 'P',
    合格: 'P',
    及格: 'P',
    PASS: 'P',
    Pass: 'P',
    pass: 'P',
    P: 'P',
    p: 'P',
    不通过: 'NP',
    不合格: 'NP',
    未通过: 'NP',
    FAIL: 'NP',
    Fail: 'NP',
    fail: 'NP',
    F: 'NP',
    f: 'NP',
};

type CampusTag = {
    __campus: 'main' | 'med';
    __termKey?: string;
};

function resolveEndpoint() {
    if (!BACKEND_URL) {
        return {
            url: PKUHSC_ENDPOINT,
            credentials: 'same-origin' as const,
            mode: 'same-origin' as const,
        };
    }
    const trimmed = BACKEND_URL.replace(/\/+$/, '');
    return {
        url: `${trimmed}/med-scores`,
        credentials: 'omit' as const,
        mode: 'cors' as const,
    };
}

function resolveGidEndpoint() {
    if (!BACKEND_URL) {
        return {
            url: '/med-gid',
            credentials: 'same-origin' as const,
            mode: 'same-origin' as const,
        };
    }
    const trimmed = BACKEND_URL.replace(/\/+$/, '');
    return {
        url: `${trimmed}/med-gid`,
        credentials: 'omit' as const,
        mode: 'cors' as const,
    };
}

export async function fetchMedCampusGid(params: MedGidParams): Promise<MedGidResult> {
    try {
        const target = resolveGidEndpoint();
        const response = await fetch(target.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: target.mode,
            credentials: target.credentials,
            body: JSON.stringify({
                username: params.username,
                password: params.password,
            }),
        });

        if (!response.ok) {
            return {
                success: false,
                errMsg: `医学部 GID 接口返回异常（${response.status}）`,
            };
        }

        const json = (await response.json()) as MedGidResult;
        if (!json.success) {
            return {
                success: false,
                errMsg: json.errMsg || '医学部 GID 获取失败',
            };
        }
        return json;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            errMsg: message || '医学部 GID 获取失败',
        };
    }
}

export async function fetchMedCampusScores(params: MedClientParams): Promise<ApiResult> {
    try {
        const target = resolveEndpoint();
        const response = await fetch(target.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: target.mode,
            credentials: target.credentials,
            body: JSON.stringify({
                username: params.username,
                password: params.password,
                gid: params.gid,
            }),
        });

        if (!response.ok) {
            return {
                success: false,
                errMsg: `医学部代理接口返回异常（${response.status}）`,
            };
        }

        const medProxy = (await response.json()) as ProxyResponse;
        if (!medProxy.success) {
            return {
                success: false,
                errMsg: medProxy.errMsg ?? '医学部代理接口返回错误',
            };
        }

        const medJson = medProxy.data;
        if (medJson.code !== '0' && medJson.code !== 0) {
            return {
                success: false,
                errMsg: '医学部成绩接口返回错误',
            };
        }

        const rows = Array.isArray(medJson.datas?.xscjcx?.rows) ? medJson.datas?.xscjcx?.rows ?? [] : [];

        const processedRows = processRows(rows, params.excludeMainCampus);
        const scores = convertRowsToBks(processedRows, params.username);

        return {
            success: true,
            ...scores,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            errMsg: message || '医学部成绩获取失败',
        };
    }
}

type ProxyResponse =
    | {
          success: true;
          data: MedQueryResponse;
      }
    | {
          success: false;
          errMsg?: string;
      };

export function mergeScores(main: ApiResult, med: ApiResult): ApiResult {
    if (!main.success) return main;
    if (!med.success) return med;
    if (main.xslb !== 'bks' || med.xslb !== 'bks') {
        return main;
    }

    const mergedCourses = [
        ...main.cjxx.map((row) => ({
            ...row,
            __campus: 'main' as const,
            __termKey: normalizeTermKey(readTermKey(row)),
        })),
        ...med.cjxx.map((row) => ({
            ...row,
            __campus: 'med' as const,
            __termKey: normalizeTermKey(readTermKey(row)),
        })),
    ];
    const merged: BksScores = {
        xslb: 'bks',
        jbxx: main.jbxx,
        cjxx: mergedCourses,
        zjlcjxx: main.zjlcjxx,
        bylwcjxx: main.bylwcjxx,
        fscjxx: main.fscjxx,
        gpa: {
            ...main.gpa,
        },
    };
    const gpaValue = computeOfficialGpa(merged) ?? main.gpa.gpa;

    return {
        success: true,
        ...merged,
        gpa: {
            ...merged.gpa,
            gpa: gpaValue ?? '',
        },
        fsgpa: main.fsgpa,
    };
}

function processRows(rows: MedScoreRow[], excludeMainCampus: boolean): MedScoreRow[] {
    const filtered = excludeMainCampus ? rows.filter((row) => row.KKDWDM_DISPLAY !== '北大本部') : rows;
    return dedupeRows(filtered);
}

function dedupeRows(rows: MedScoreRow[]): MedScoreRow[] {
    const map = new Map<string, MedScoreRow>();
    rows.forEach((row) => {
        const key = buildRowKey(row);
        if (!key) return;

        const existing = map.get(key);
        if (!existing) {
            map.set(key, row);
            return;
        }

        const prevDate = parseDate(existing.KSSJ);
        const nextDate = parseDate(row.KSSJ);
        if (nextDate >= prevDate) {
            map.set(key, row);
        }
    });
    return Array.from(map.values());
}

function buildRowKey(row: MedScoreRow): string {
    if (row.XSKCH && row.XSKCH.trim()) return row.XSKCH.trim();
    const combined = [row.KCH, row.KXH].filter(Boolean).join('-');
    if (combined) return combined;
    if (row.WID) return row.WID;
    if (row.XSKCM && row.XNXQDM) return `${row.XSKCM}-${row.XNXQDM}`;
    return '';
}

function parseDate(value: string | null | undefined): number {
    if (!value) return Number.MIN_SAFE_INTEGER;
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) return Number.MIN_SAFE_INTEGER;
    return timestamp;
}

function convertRowsToBks(rows: MedScoreRow[], username: string): BksScores {
    const cjxx = rows.map((row) => convertRow(row));
    const base: BksScores = {
        xslb: 'bks',
        jbxx: {
            xh: username,
            xsyw: '',
            xm: '',
            xsmc: '',
            zyywmc: '',
            xjzt: '',
            xmpy: '',
            zxnj: '',
            zymc: '',
        },
        cjxx,
        gpa: {
            gpa: '',
        },
    };
    const gpa = computeOfficialGpa(base);
    return {
        ...base,
        gpa: {
            ...base.gpa,
            gpa: gpa ?? '',
        },
    };
}

function convertRow(row: MedScoreRow) {
    const term = parseTerm(row.XNXQDM ?? '');
    const semesterDisplay = formatSemesterDisplay(term.displayYear, term.semester, row.XNXQDM_DISPLAY);
    const academicYearDisplay = term.displayYear ? `${term.displayYear}学年` : semesterDisplay;
    const score = readScore(row);
    const categoryName = normalizeCategoryName(row.KCLBDM_DISPLAY);
    const categoryCode = readCategoryCode(row.KCLBDM, row.KCXZDM);
    return {
        xslb: 'bks',
        zxjhbh: row.XSKCH ?? '',
        jxbh: row.JXBID ?? '',
        kctxm: '',
        xqcj: score,
        xq: term.semester,
        ywmc: row.KCM ?? row.XSKCM ?? '',
        skjsxm: '',
        skjszgh: '',
        xnd: term.displayYear,
        jd: readGpa(row),
        kch: (row.XSKCH ?? row.KCH ?? row.WID ?? `${row.XSKCM ?? ''}-${row.XNXQDM ?? ''}`).toString(),
        bkcjbh: row.WID ?? '',
        kclbmc: categoryName,
        xndxqpx: semesterDisplay,
        kcmc: row.XSKCM ?? row.KCM ?? '',
        xndpx: academicYearDisplay,
        xf: readCredit(row),
        kclb: categoryCode,
        kctx: row.KCXZDM_DISPLAY ?? '',
        __campus: 'med',
        __termKey: term.termKey,
    } as unknown as BksScores['cjxx'][number] & CampusTag;
}

function parseTerm(term: string) {
    const trimmed = (term ?? '').trim();
    const matched = /^(\d{4})(?:-(\d{4}))?-(\d)$/.exec(trimmed);
    if (matched) {
        const start = matched[1];
        const end = matched[2] ?? String(Number.parseInt(start, 10) + 1);
        const semester = matched[3];
        return {
            displayYear: toTwoDigitYear(start),
            semester,
            termKey: `${start}-${end}-${semester}`,
            startYear: Number.parseInt(start, 10),
        };
    }

    const fallback = trimmed.split('-');
    const startCandidate = fallback[0] ?? '';
    const semesterCandidate = fallback[2] ?? fallback[1] ?? '';
    const startYear = normalizeStartYear(startCandidate);
    const endYear = startYear !== null ? startYear + 1 : normalizeStartYear(fallback[1] ?? '');
    const displayYear = toTwoDigitYear(startCandidate);
    const semester = semesterCandidate.trim();
    const termKey =
        startYear !== null && endYear !== null && semester
            ? `${startYear}-${endYear}-${semester}`
            : trimmed || `${displayYear}-${semester}`;
    return {
        displayYear,
        semester,
        termKey,
        startYear,
    };
}

function toTwoDigitYear(year: string): string {
    const numeric = Number.parseInt(year, 10);
    if (!Number.isNaN(numeric) && numeric !== 0) {
        return String(numeric % 100).padStart(2, '0');
    }
    const trimmed = (year ?? '').trim();
    if (trimmed.length === 4) {
        return trimmed.slice(-2);
    }
    return trimmed;
}

function normalizeStartYear(value: string | null | undefined): number | null {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return null;
    if (/^\d{4}$/.test(trimmed)) {
        return Number.parseInt(trimmed, 10);
    }
    if (/^\d{2}$/.test(trimmed)) {
        const parsed = Number.parseInt(trimmed, 10);
        if (Number.isNaN(parsed)) return null;
        if (parsed >= 90) {
            return 1900 + parsed;
        }
        return 2000 + parsed;
    }
    const fourDigits = trimmed.match(/\d{4}/);
    if (fourDigits) {
        return Number.parseInt(fourDigits[0], 10);
    }
    return null;
}

function normalizeSemesterPart(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = value.toString().trim();
    if (!trimmed) return null;
    const numeric = Number.parseInt(trimmed, 10);
    if (!Number.isNaN(numeric)) {
        return numeric.toString();
    }
    const stripped = trimmed.replace(/^0+/, '');
    return stripped || trimmed;
}

function buildTermKey(xnd: string | null | undefined, xq: string | null | undefined) {
    const startYear = normalizeStartYear(xnd);
    const semesterNormalized = normalizeSemesterPart(xq);
    const yearToken = (xnd ?? '').trim();
    const semesterToken = semesterNormalized ?? (xq ?? '').trim();
    if (startYear === null || !semesterToken) {
        const tokens = [yearToken, semesterToken].filter((token) => token.length > 0);
        return tokens.join('-');
    }
    const endYear = startYear + 1;
    return `${startYear}-${endYear}-${semesterNormalized}`;
}

function normalizeTermKey(termKey: string | null | undefined): string {
    const trimmed = (termKey ?? '').trim();
    if (!trimmed) {
        return trimmed;
    }
    const parts = trimmed.split('-');
    if (parts.length >= 3) {
        const startYear = normalizeStartYear(parts[0]);
        if (startYear !== null) {
            parts[0] = String(startYear);
            if (parts.length >= 2) {
                const endYearRaw = parts[1];
                const normalizedEnd = normalizeStartYear(endYearRaw);
                parts[1] = String(normalizedEnd ?? startYear + 1);
            }
        }
        const lastIndex = parts.length - 1;
        const normalizedSemester = normalizeSemesterPart(parts[lastIndex]);
        if (normalizedSemester !== null) {
            parts[lastIndex] = normalizedSemester;
        }
        return parts.join('-');
    }
    return trimmed;
}

function readTermKey(row: BksScores['cjxx'][number]): string {
    const candidate = (row as unknown as CampusTag).__termKey;
    if (candidate && candidate.trim().length > 0) {
        return candidate.trim();
    }
    return buildTermKey(row.xnd, row.xq);
}

function formatSemesterDisplay(xnd: string, xq: string, fallback?: string | null): string {
    if (xnd && xq) {
        return `${xnd}学年 第${xq}学期`;
    }
    return fallback ?? '';
}

function readCredit(row: MedScoreRow): string {
    if (typeof row.XF === 'number') return row.XF.toString();
    if (typeof row.XF === 'string' && row.XF.trim().length > 0) return row.XF;
    return '0';
}

function readGpa(row: MedScoreRow): string {
    if (row.XFJD === null || row.XFJD === undefined) return '';
    if (typeof row.XFJD === 'number') return row.XFJD.toFixed(2);
    if (typeof row.XFJD === 'string') return row.XFJD;
    return '';
}

function readScore(row: MedScoreRow): string {
    if (isDeferredExam(row)) {
        return '缓考';
    }

    if (isPassFail(row)) {
        const djcjmc = row.DJCJMC ?? '';
        // Try exact match first
        const mapped = PASS_FAIL_MAP[djcjmc];
        if (mapped) return mapped;

        // Try case-insensitive match
        const upperKey = djcjmc.toUpperCase();
        for (const [key, value] of Object.entries(PASS_FAIL_MAP)) {
            if (key.toUpperCase() === upperKey) {
                return value;
            }
        }

        // Default to P if no match found
        return 'P';
    }

    const candidates = [row.ZCJ, row.QMCJ, row.SYCJ, row.QMCJXS, row.SYCJ_DISPLAY, row.ZCJ_DISPLAY];
    for (const candidate of candidates) {
        if (candidate === null || candidate === undefined || candidate === '') {
            continue;
        }
        if (typeof candidate === 'number') {
            return candidate.toString();
        }
        const trimmed = String(candidate).trim();
        if (trimmed) {
            return trimmed;
        }
    }
    return '0';
}

function isDeferredExam(row: MedScoreRow): boolean {
    if (typeof row.TSYYDM_DISPLAY === 'string' && row.TSYYDM_DISPLAY.includes('缓考')) {
        return true;
    }
    if (typeof row.DJCJMC === 'string' && row.DJCJMC.includes('缓考')) {
        return true;
    }
    if (typeof row.XDFSDM_DISPLAY === 'string' && row.XDFSDM_DISPLAY.includes('缓考')) {
        return true;
    }
    return false;
}

function isPassFail(row: MedScoreRow) {
    if (row.DJCJLXDM_DISPLAY?.includes('两级制')) return true;
    if (row.DJCJLXDM?.includes('200')) return true;
    if (row.DJCJMC && PASS_FAIL_MAP[row.DJCJMC] !== undefined) return true;
    return false;
}

function computeOfficialGpa(data: BksScores): string | null {
    const parsed = parseScore(data);
    const gpaNumber = calcGpa(parsed.courses);
    if (gpaNumber === null) {
        return null;
    }
    return gpaNumber.toFixed(3);
}

function normalizeCategoryName(value: string | null | undefined): string {
    const trimmed = (value ?? '').replace(/\s+/g, ' ').trim();
    if (!trimmed) {
        return '未分类';
    }
    const normalized = trimmed
        .replace(/必修课/g, '必修')
        .replace(/选修课/g, '选修')
        .trim();
    return normalized || '未分类';
}

function readCategoryCode(primary: string | null | undefined, secondary: string | null | undefined): string {
    const primaryTrimmed = (primary ?? '').trim();
    if (primaryTrimmed) {
        return primaryTrimmed;
    }
    const secondaryTrimmed = (secondary ?? '').trim();
    if (secondaryTrimmed) {
        return secondaryTrimmed;
    }
    return 'UNCLASSIFIED';
}
