'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { calcGpa, Course, fix, guessScoreFromGpa, scoreTampered, sumCredit } from '@/lib/scoreParser';
import { colorizeSemester, makeScoreGradient } from '@/lib/colorize';

type OverallSectionProps = {
    courses: Course[];
    isopGpa: string | null;
    hideText: boolean;
    judgeByGpa: boolean;
};

export function OverallSection({ courses, isopGpa, hideText, judgeByGpa }: OverallSectionProps) {
    const [collapsed, setCollapsed] = useState(false);
    const totalCredit = useMemo(() => sumCredit(courses), [courses]);
    const totalGpa = useMemo(() => calcGpa(courses), [courses]);
    const displayScore = useMemo(() => guessScoreFromGpa(totalGpa), [totalGpa]);
    const tampered = useMemo(() => scoreTampered(courses), [courses]);

    const categories = useMemo(() => {
        const map = new Map<string, number[]>();
        courses.forEach((course, index) => {
            const list = map.get(course.type) ?? [];
            list.push(index);
            map.set(course.type, list);
        });

        return Array.from(map.entries())
            .map(([name, indices]) => {
                const credit = sumCredit(courses, indices);
                const gpa = calcGpa(courses, indices);
                const score = guessScoreFromGpa(gpa);
                const tampered = indices.some((idx) => `${courses[idx].score}` !== `${courses[idx].trueScore}`);
                const details = indices
                    .map((idx) => {
                        const course = courses[idx];
                        return `${fix(course.credit, 1)}学分 · ${course.name} · ${fix(course.score, 1)}`;
                    })
                    .join('\n');
                return {
                    name,
                    length: indices.length,
                    credit,
                    gpa,
                    score,
                    tampered,
                    details,
                };
            })
            .sort((a, b) => {
                // Sort by GPA (desc), then credit (desc), then course count (desc), then name (asc).
                const gpaA = a.gpa ?? Number.NEGATIVE_INFINITY;
                const gpaB = b.gpa ?? Number.NEGATIVE_INFINITY;
                if (gpaA !== gpaB) return gpaB - gpaA;
                if (a.credit !== b.credit) return b.credit - a.credit;
                if (a.length !== b.length) return b.length - a.length;
                return a.name.localeCompare(b.name, 'zh-Hans');
            });
    }, [courses]);

    return (
        <section className="mt-8 animate-fade-in [&>*:first-child]:shadow-[0_0_6px_rgba(0,0,0,0.8)] [&>*:first-child]:z-10 [&>*:first-child]:sticky [&>*:first-child]:top-0 [&>*:not(:first-child)]:mx-4">
            <div className={clsx(tampered && "[&_*]:line-through [&_*]:decoration-red-500/50")}>
                <div
                    className="flex p-1 px-2 text-black [text-shadow:0_0_3px_white] relative cursor-pointer"
                    style={{ background: colorizeSemester(displayScore, judgeByGpa) }}
                    onClick={() => setCollapsed(prev => !prev)}
                    role="button"
                    aria-expanded={!collapsed}
                >
                    <div className="flex-[0_0_3.5em] text-center overflow-hidden min-w-0 [&>*]:z-[5]">
                        <div className="flex flex-col items-center justify-center transition-opacity duration-150 ease-out w-full h-fit min-w-0 py-[0.15rem]">
                            <div className="leading-[1.1] font-semibold w-full">{fix(totalCredit, 1)}</div>
                            <div className="text-[60%] w-full">学分</div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 [&>*]:z-[5]">
                        <div className={clsx(
                            "flex flex-col items-start justify-center transition-opacity duration-150 ease-out w-full h-fit min-w-0 py-[0.15rem] text-left",
                            hideText && "opacity-0"
                        )}>
                            <div className="leading-[1.1] font-medium w-full">总绩点</div>
                            <div className="text-[60%] w-full mt-[0.35em]">
                                共 {courses.length} 门课程，官方 GPA：{isopGpa ?? '-.--'}
                            </div>
                        </div>
                    </div>
                    <div className="flex-[0_0_3.5em] text-center overflow-hidden min-w-0 [&>*]:z-[5]">
                        <div className={clsx(
                            "flex flex-col items-center justify-center transition-opacity duration-150 ease-out w-full h-fit min-w-0 py-[0.15rem] text-center max-w-[4em]",
                            hideText && "opacity-0"
                        )}>
                            <div className="leading-[1.1] font-semibold w-full overflow-hidden text-ellipsis whitespace-nowrap">{totalGpa !== null ? totalGpa.toFixed(3) : '-.---'}</div>
                            <div className="text-[60%] w-full overflow-hidden text-ellipsis whitespace-nowrap">{fix(displayScore, 1)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {!collapsed && categories.map((category) => (
                <CategoryRow key={category.name} data={category} hideText={hideText} judgeByGpa={judgeByGpa} />
            ))}
        </section>
    );
}

type CategoryRowProps = {
    data: {
        name: string;
        length: number;
        credit: number;
        gpa: number | null;
        score: number | string;
        tampered: boolean;
        details: string;
    };
    hideText: boolean;
    judgeByGpa: boolean;
};

function CategoryRow({ data, hideText, judgeByGpa }: CategoryRowProps) {
    const [showDetails, setShowDetails] = useState(false);
    const background = useMemo(() => makeScoreGradient(data.score, judgeByGpa), [data.score, judgeByGpa]);
    const detailLines = useMemo(
        () => data.details.split('\n').filter((line) => line.trim().length > 0),
        [data.details]
    );

    return (
        <div className={clsx("relative shadow-[0_-1px_0_#7f7f7f]", data.tampered && "[&_*]:line-through [&_*]:decoration-red-500/50")}>
            <div className="flex p-1 text-black [text-shadow:0_0_3px_white] relative" style={{ background }}>
                <div className="flex-[0_0_3.5em] text-center overflow-hidden min-w-0 [&>*]:z-[5]">
                    <div className="flex flex-col items-center justify-center transition-opacity duration-150 ease-out w-full h-fit min-w-0 py-[0.15rem]">
                        <div className="leading-[1.1] font-semibold w-full">{fix(data.credit, 1)}</div>
                        <div className="text-[60%] w-full">学分</div>
                    </div>
                </div>
                <div className="flex-1 min-w-0 [&>*]:z-[5]">
                    <div
                        className="flex flex-col items-start justify-center transition-opacity duration-150 ease-out w-full h-fit min-w-0 py-[0.15rem] text-left"
                        onClick={() => setShowDetails((prev) => !prev)}
                        role={detailLines.length ? 'button' : undefined}>
                        <div className="leading-[1.1] font-medium w-full">{data.name}</div>
                        <div className="text-[60%] w-full mt-[0.35em]">共 {data.length} 门课程</div>
                        {detailLines.length > 0 && (
                            <div
                                className={clsx(
                                    "text-[60%] w-full transition-[max-height] duration-150 ease-out [text-shadow:none] text-inherit [overflow-wrap:anywhere]",
                                    showDetails ? "max-h-28 overflow-y-auto overflow-x-hidden mt-[0.35em]" : "max-h-0 overflow-hidden"
                                )}>
                                {detailLines.map((line, idx) => (
                                    <p key={`${line}-${idx}`}>
                                        {line}
                                        <br />
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-[0_0_3.5em] text-center overflow-hidden min-w-0 [&>*]:z-[5]">
                    <div className={clsx(
                        "flex flex-col items-center justify-center transition-opacity duration-150 ease-out w-full h-fit min-w-0 py-[0.15rem] text-center max-w-[4em]",
                        hideText && "opacity-0"
                    )}>
                        <div className="leading-[1.1] font-semibold w-full overflow-hidden text-ellipsis whitespace-nowrap">{data.gpa !== null ? data.gpa.toFixed(3) : '-.---'}</div>
                        <div className="text-[60%] w-full overflow-hidden text-ellipsis whitespace-nowrap">{fix(data.score, 1)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
