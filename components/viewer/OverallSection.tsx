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
        <section className="semester-block">
            <div className={clsx({ 'row-tampered': tampered })}>
                <div
                    className="layout-row !px-2"
                    style={{ background: colorizeSemester(displayScore, judgeByGpa), cursor: 'pointer' }}
                    onClick={() => setCollapsed(prev => !prev)}
                    role="button"
                    aria-expanded={!collapsed}
                >
                    <div className="layout-row-left">
                        <div className="layout-vertical">
                            <div className="layout-vertical-up">{fix(totalCredit, 1)}</div>
                            <div className="layout-vertical-down">学分</div>
                        </div>
                    </div>
                    <div className="layout-row-middle">
                        <div className={clsx('layout-vertical', hideText && 'score-hide')}>
                            <div className="layout-vertical-up">总绩点</div>
                            <div className="layout-vertical-down">
                                共 {courses.length} 门课程，官方 GPA：{isopGpa ?? '-.--'}
                            </div>
                        </div>
                    </div>
                    <div className="layout-row-right">
                        <div className={clsx('layout-vertical', hideText && 'score-hide')}>
                            <div className="layout-vertical-up">{totalGpa !== null ? totalGpa.toFixed(2) : '-.--'}</div>
                            <div className="layout-vertical-down">{fix(displayScore, 1)}</div>
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
        <div className={clsx('course-row', { 'row-tampered': data.tampered })}>
            <div className="layout-row" style={{ background }}>
                <div className="layout-row-left">
                    <div className="layout-vertical">
                        <div className="layout-vertical-up">{fix(data.credit, 1)}</div>
                        <div className="layout-vertical-down">学分</div>
                    </div>
                </div>
                <div className="layout-row-middle">
                    <div
                        className="layout-vertical"
                        onClick={() => setShowDetails((prev) => !prev)}
                        role={detailLines.length ? 'button' : undefined}>
                        <div className="layout-vertical-up">{data.name}</div>
                        <div className="layout-vertical-down">共 {data.length} 门课程</div>
                        {detailLines.length > 0 && (
                            <div
                                className={clsx(
                                    'layout-vertical-extra',
                                    showDetails ? 'layout-vertical-extra-show' : 'layout-vertical-extra-hide'
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
                <div className="layout-row-right">
                    <div className={clsx('layout-vertical', hideText && 'score-hide')}>
                        <div className="layout-vertical-up">{data.gpa !== null ? data.gpa.toFixed(2) : '-.--'}</div>
                        <div className="layout-vertical-down">{fix(data.score, 1)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
