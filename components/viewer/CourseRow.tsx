'use client';

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { describe, fix, courseGpaFromNormalizedScore, isFull } from "@/lib/scoreParser";
import { makeScoreGradient } from "@/lib/colorize";
import { IconWarning } from "@/components/Icons";
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
    <div className={clsx("relative shadow-[0_-1px_0_#7f7f7f]", tampered && "[&_*]:line-through [&_*]:decoration-red-500/50")}>
      <div
        className={clsx(
          "flex p-1 text-black [text-shadow:0_0_3px_white] relative",
          !tampered && isFull(course.score) && "rainbow"
        )}
        style={{ background }}
      >
        <div className="flex-[0_0_3.5em] text-center overflow-hidden min-w-0 [&>*]:z-[5]">
          <div className="flex flex-col items-center justify-center transition-opacity duration-150 ease-out w-full h-fit min-w-0 py-[0.15rem]">
            <div className="leading-[1.1] font-semibold w-full">{fix(course.credit, 1)}</div>
            <div className="text-[60%] w-full">学分</div>
          </div>
        </div>
        <div className="flex-1 min-w-0 [&>*]:z-[5]">
          <div
            className={clsx(
              "flex flex-col items-start justify-center transition-opacity duration-150 ease-out w-full h-fit min-w-0 py-[0.15rem] text-left",
              hideText && "opacity-0"
            )}
            onClick={toggleExtras}
            role={hasExtras ? "button" : undefined}
          >
            <div className="leading-[1.1] font-medium w-full">
              {tampered && (
                <span
                  className="prevent-click-handler inline-block cursor-pointer px-1 rounded mr-[0.4em] text-red-500 [&]:!no-underline [&>*]:!no-underline hover:bg-red-500 hover:text-white hover:[text-shadow:none] relative group"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUntamper(index);
                  }}
                  data-tooltip="非真实成绩"
                >
                  <IconWarning />
                  <span className="hidden group-hover:block absolute text-[0.8rem] w-24 h-[1.2em] leading-[1.2em] top-5 -left-1 rounded text-center text-white bg-black/60 pointer-events-none z-[100]">非真实成绩</span>
                </span>
              )}
              {course.name}
            </div>
            <div className="text-[60%] w-full mt-[0.35em]">{course.details}</div>
            {hasExtras && (
              <div
                className={clsx(
                  "text-[60%] w-full transition-[max-height] duration-150 ease-out [text-shadow:none] text-inherit [overflow-wrap:anywhere]",
                  showExtras
                    ? "max-h-28 overflow-y-auto overflow-x-hidden mt-[0.35em]"
                    : "max-h-0 overflow-hidden"
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
        <div className="flex-[0_0_3.5em] text-center overflow-hidden min-w-0 [&>*]:z-[5]">
          <div
            className={clsx(
              "flex flex-col items-center justify-center transition-opacity duration-150 ease-out w-full h-fit min-w-0 py-[0.15rem] text-center max-w-[4em]",
              shouldHideRight && "opacity-0"
            )}
          >
            <div className="leading-[1.1] font-semibold w-full overflow-hidden text-ellipsis whitespace-nowrap">
              <input
                type="text"
                className="bg-transparent border-0 font-inherit text-center w-full max-w-[4em] text-inherit [text-shadow:0_0_3px_white] leading-[1em] p-0 m-0 overflow-hidden text-ellipsis cursor-pointer focus:cursor-text"
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
            <div className="text-[60%] w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {gpa !== null ? gpa.toFixed(3) : describe(course.score)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
