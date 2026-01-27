'use client';

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  calcGpa,
  Course,
  courseGpaFromNormalizedScore,
  fix,
  guessScoreFromGpa,
  isFail,
  Semester,
  sumCredit,
} from "@/lib/scoreParser";
import { colorizeSemester } from "@/lib/colorize";
import { CourseRow } from "@/components/viewer/CourseRow";

type SemesterSectionProps = {
  semester: Semester;
  courses: Course[];
  hideText: boolean;
  judgeByGpa: boolean;
  collapseAll: boolean;
  onTamper: (index: number, value: string) => void;
  onUntamper: (index: number) => void;
};

export function SemesterSection({
  semester,
  courses,
  hideText,
  judgeByGpa,
  collapseAll,
  onTamper,
  onUntamper,
}: SemesterSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Sync with global collapse state
  useEffect(() => {
    setCollapsed(collapseAll);
  }, [collapseAll]);

  const sortedIndices = useMemo(() => {
    return [...semester.courseList].sort((a, b) => {
      const s1 = courseGpaFromNormalizedScore(courses[a].score) ?? 0;
      const s2 = courseGpaFromNormalizedScore(courses[b].score) ?? 0;
      const f1 = Number(isFail(courses[a].score));
      const f2 = Number(isFail(courses[b].score));
      if (s1 !== s2) return s2 - s1;
      if (f1 !== f2) return f2 - f1;
      return b - a;
    });
  }, [courses, semester.courseList]);

  const credit = useMemo(() => sumCredit(courses, sortedIndices), [courses, sortedIndices]);

  const semesterGpa = useMemo(() => {
    return calcGpa(courses, sortedIndices);
  }, [courses, sortedIndices]);

  const displayScore = useMemo(() => guessScoreFromGpa(semesterGpa), [semesterGpa]);
  const tampered = useMemo(
    () => sortedIndices.some((idx) => `${courses[idx].score}` !== `${courses[idx].trueScore}`),
    [courses, sortedIndices],
  );

  const headerBackground = useMemo(
    () => colorizeSemester(displayScore, judgeByGpa),
    [displayScore, judgeByGpa],
  );

  return (
    <section className="mt-8 animate-fade-in [&>*:first-child]:shadow-[0_0_6px_rgba(0,0,0,0.8)] [&>*:first-child]:z-10 [&>*:first-child]:sticky [&>*:first-child]:top-0 [&>*:not(:first-child)]:mx-4">
      <div className={clsx(tampered && "[&_*]:line-through [&_*]:decoration-red-500/50")}>
        <div
          className="flex p-1 text-black [text-shadow:0_0_3px_white] relative cursor-pointer"
          style={{ background: headerBackground }}
          onClick={() => setCollapsed(prev => !prev)}
          role="button"
          aria-expanded={!collapsed}
        >
          <div className="flex-[0_0_3.5em] text-center overflow-hidden min-w-0 [&>*]:z-[5]">
            <div className="flex flex-col items-center justify-center transition-opacity duration-150 ease-out w-full h-fit min-w-0 py-[0.15rem]">
              <div className="leading-[1.1] font-semibold w-full">{fix(credit, 1)}</div>
              <div className="text-[60%] w-full">学分</div>
            </div>
          </div>
          <div className="flex-1 min-w-0 [&>*]:z-[5]">
            <div className="flex flex-col items-start justify-center transition-opacity duration-150 ease-out w-full h-fit min-w-0 py-[0.15rem] text-left">
              <div className="leading-[1.1] font-medium w-full">{semester.name}</div>
              <div className="text-[60%] w-full mt-[0.35em]">
                共 {sortedIndices.length} 门课程
              </div>
            </div>
          </div>
          <div className="flex-[0_0_3.5em] text-center overflow-hidden min-w-0 [&>*]:z-[5]">
            <div
              className={clsx(
                "flex flex-col items-center justify-center transition-opacity duration-150 ease-out w-full h-fit min-w-0 py-[0.15rem] text-center max-w-[4em]",
                hideText && "opacity-0"
              )}
            >
              <div className="leading-[1.1] font-semibold w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {semesterGpa !== null ? semesterGpa.toFixed(3) : "-.---"}
              </div>
              <div className="text-[60%] w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {fix(displayScore, 1)}
              </div>
            </div>
          </div>
        </div>
      </div>
      {!collapsed && sortedIndices.map((index) => (
        <CourseRow
          key={courses[index].id + index}
          course={courses[index]}
          index={index}
          hideText={hideText}
          judgeByGpa={judgeByGpa}
          onTamper={onTamper}
          onUntamper={onUntamper}
        />
      ))}
    </section>
  );
}
