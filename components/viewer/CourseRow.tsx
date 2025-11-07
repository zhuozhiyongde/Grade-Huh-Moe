'use client';

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { describe, fix, courseGpaFromNormalizedScore, isFull } from "@/lib/scoreParser";
import { makeScoreGradient } from "@/lib/colorize";
import type { Course } from "@/lib/scoreParser";

type CourseRowProps = {
  course: Course;
  index: number;
  hideText: boolean;
  judgeByGpa: boolean;
  onTamper: (index: number, value: string) => void;
  onUntamper: (index: number) => void;
};

export function CourseRow({
  course,
  index,
  hideText,
  judgeByGpa,
  onTamper,
  onUntamper,
}: CourseRowProps) {
  const [showExtras, setShowExtras] = useState(false);
  const [inputValue, setInputValue] = useState(String(course.score));

  useEffect(() => {
    setInputValue(String(course.score));
  }, [course.score]);

  const tampered = useMemo(
    () => `${course.score}` !== `${course.trueScore}`,
    [course.score, course.trueScore],
  );
  const background = useMemo(
    () => makeScoreGradient(course.score, judgeByGpa),
    [course.score, judgeByGpa],
  );
  const gpa = useMemo(
    () => courseGpaFromNormalizedScore(course.score),
    [course.score],
  );

  const handleSubmit = () => {
    onTamper(index, inputValue.trim());
  };

  const courseExtras = course.extras ?? [];
  const hasExtras = courseExtras.length > 0;
  const numericScore = Number(course.score);
  const shouldHideRight =
    hideText &&
    (gpa !== null ||
      (!Number.isNaN(numericScore) && Number.isFinite(numericScore) && numericScore < 60));

  const toggleExtras = () => {
    if (hasExtras) {
      setShowExtras((prev) => !prev);
    }
  };

  return (
    <div className={clsx("course-row", { "row-tampered": tampered })}>
      <div
        className={clsx("layout-row", !tampered && isFull(course.score) && "rainbow")}
        style={{ background }}
      >
        <div className="layout-row-left">
          <div className="layout-vertical">
            <div className="layout-vertical-up">{fix(course.credit, 1)}</div>
            <div className="layout-vertical-down">学分</div>
          </div>
        </div>
        <div className="layout-row-middle">
          <div
            className={clsx("layout-vertical", hideText && "score-hide")}
            onClick={toggleExtras}
            role={hasExtras ? "button" : undefined}
          >
            <div className="layout-vertical-up">
              {tampered && (
                <span
                  className="prevent-click-handler course-badge course-badge-danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUntamper(index);
                  }}
                  data-tooltip="非真实成绩"
                >
                  <span className="icon icon-warning" />
                </span>
              )}
              {course.name}
            </div>
            <div className="layout-vertical-down">{course.details}</div>
            {hasExtras && (
              <div
                className={clsx(
                  "layout-vertical-extra",
                  showExtras
                    ? "layout-vertical-extra-show"
                    : "layout-vertical-extra-hide",
                )}
              >
                {courseExtras.map((extra) => (
                  <p key={`${extra.label}-${extra.value}`}>
                    <strong>{extra.label}：</strong>
                    {extra.href ? (
                      <a
                        href={extra.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="prevent-click-handler"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {extra.value}
                      </a>
                    ) : (
                      extra.value
                    )}
                    <br />
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="layout-row-right">
          <div
            className={clsx("layout-vertical", shouldHideRight && "score-hide")}
          >
            <div className="layout-vertical-up">
              <input
                type="text"
                className="score-tamperer"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onBlur={handleSubmit}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
              />
            </div>
            <div className="layout-vertical-down">
              {gpa !== null ? gpa.toFixed(2) : describe(course.score)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
