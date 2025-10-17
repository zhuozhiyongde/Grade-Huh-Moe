'use client';

import { useMemo } from "react";
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
  onTamper: (index: number, value: string) => void;
  onUntamper: (index: number) => void;
};

export function SemesterSection({
  semester,
  courses,
  hideText,
  judgeByGpa,
  onTamper,
  onUntamper,
}: SemesterSectionProps) {
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
    <section className="semester-block">
      <div className={clsx({ "row-tampered": tampered })}>
        <div className="layout-row" style={{ background: headerBackground }}>
          <div className="layout-row-left">
            <div className="layout-vertical">
              <div className="layout-vertical-up">{fix(credit, 1)}</div>
              <div className="layout-vertical-down">学分</div>
            </div>
          </div>
          <div className="layout-row-middle">
            <div className="layout-vertical">
              <div className="layout-vertical-up">{semester.name}</div>
              <div className="layout-vertical-down">
                共 {sortedIndices.length} 门课程
              </div>
            </div>
          </div>
          <div className="layout-row-right">
            <div
              className={clsx("layout-vertical", hideText && "score-hide")}
            >
              <div className="layout-vertical-up">
                {semesterGpa !== null ? semesterGpa.toFixed(2) : "-.--"}
              </div>
              <div className="layout-vertical-down">
                {fix(displayScore, 1)}
              </div>
            </div>
          </div>
        </div>
      </div>
      {sortedIndices.map((index) => (
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
