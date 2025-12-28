'use client';

import { useEffect, useMemo } from "react";
import clsx from "clsx";
import { calcGpa, Course } from "@/lib/scoreParser";
import { colorizeNewBlock } from "@/lib/colorize";
import { CourseRow } from "@/components/viewer/CourseRow";
import { sortCourseIndices } from "@/lib/courseSort";

type NewBlockCardProps = {
  courses: Course[];
  newIndices: number[];
  hideText: boolean;
  judgeByGpa: boolean;
  onDismiss: () => void;
  onTamper: (index: number, value: string) => void;
  onUntamper: (index: number) => void;
};

export function NewBlockCard({
  courses,
  newIndices,
  hideText,
  judgeByGpa,
  onDismiss,
  onTamper,
  onUntamper,
}: NewBlockCardProps) {
  const sortedNewIndices = useMemo(
    () => sortCourseIndices(courses, newIndices),
    [courses, newIndices],
  );

  const newIndexSet = useMemo(() => new Set(newIndices), [newIndices]);

  const deltaGpaInfo = useMemo(() => {
    if (newIndices.length === 0) {
      return { delta: 0, type: "keep" as const };
    }
    const newGpa = calcGpa(courses);
    const remainingIndices = courses
      .map((_, idx) => idx)
      .filter((idx) => !newIndexSet.has(idx));
    const oldGpa = calcGpa(courses, remainingIndices);
    const delta = Number(newGpa ?? 0) - Number(oldGpa ?? 0);
    let type: "up" | "down" | "keep" = "keep";
    if (delta >= 0.0005) type = "up";
    else if (delta <= -0.0005) type = "down";
    return { delta, type };
  }, [courses, newIndexSet, newIndices.length]);

  useEffect(() => {
    if (newIndices.length === 0) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const names = sortedNewIndices.map((idx) => courses[idx]?.name ?? "").filter(Boolean);
    if (names.length === 0) return;
    const notification = new Notification(`新增 ${names.length} 门成绩`, {
      body: names.join("、"),
    });
    return () => notification.close();
  }, [courses, newIndices, sortedNewIndices]);

  return (
    <section className={clsx("semester-block new-block")}>
      <div>
        <div className="layout-row new-block-header" style={{ background: colorizeNewBlock() }}>
          <div
            className="layout-row-left potential-span"
            title={`△GPA = ${formatDelta(deltaGpaInfo.delta)}`}
          >
            <svg
              viewBox="0 15 240 165"
              className={clsx("potential-svg", `potential-svg-${deltaGpaInfo.type}`)}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="border-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#fafafa" />
                  <stop offset="1" id="potential-svg-border-gradient-stop" />
                </linearGradient>
                <filter
                  id="as-drop-shadow"
                  x="-100%"
                  y="-100%"
                  width="300%"
                  height="300%"
                >
                  <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
                </filter>
              </defs>
              <path
                d="m55.941667,4.725c0,0 -41.5,42.25 -41.5,42.25c0,0 104,105 104,105c0,0 106.75,-105.25 106.75,-105.25c0,0 -42.5,-42.25 -42.525,-42.225l-126.725,0.225z"
                stroke="url(#border-gradient)"
                strokeWidth="4"
                fillOpacity="0"
                filter="url(#as-drop-shadow)"
              />
              <path
                d="m55.491667,4.975c0,0 127.25,0 127.175,0.025c-0.075,0.025 42.075,41.475 42.075,41.475c0,0 -19.25,20 -19.25,20c0,0 -172.002907,0 -172.075,-0.225c-0.072093,-0.225 -18.925,-19.525 -19,-19.75l41.075,-41.525z"
                fill="#1e162b"
              />
              <path
                d="m24.491667,57.725c0,0 189,0.5 189,0.5c0,0 -94.5,93.5 -94.5,93.5l-94.5,-94z"
                id="potential-svg-background-down"
              />
              <path
                d="m55.941667,4.725c0,0 -41.5,42.25 -41.5,42.25c0,0 104,105 104,105c0,0 106.75,-105.25 106.75,-105.25c0,0 -42.5,-42.25 -42.525,-42.225l-126.725,0.225z"
                stroke="url(#border-gradient)"
                strokeWidth="4"
                fillOpacity="0"
              />
              <text
                x="119.241667"
                y="48.225"
                fill="#ffffff"
                fontFamily="Sans-serif"
                fontSize="32"
                opacity="0.95"
                textAnchor="middle"
                letterSpacing="-1"
              >
                GPA
              </text>
              <text
                x="119.241667"
                y="109.725"
                fill="#ffffff"
                fontFamily="Sans-serif"
                opacity="0.95"
                textAnchor="middle"
                fontWeight="bold"
                letterSpacing="-2"
                strokeWidth="1.5"
                id="potential-svg-text-down"
              >
                {deltaGpaInfo.type === "keep"
                  ? "-KEEP-"
                  : `${deltaGpaInfo.type === "up" ? "+" : ""}${formatDelta(deltaGpaInfo.delta)}`}
              </text>
            </svg>
          </div>
          <div className="layout-row-middle">
            <div className="layout-vertical">
              <div className="layout-vertical-up">新增成绩</div>
              <div className="layout-vertical-down">
                共 {newIndices.length} 门课程
              </div>
            </div>
          </div>
          <div className="layout-row-right">
            <button type="button" className="read-all-button" onClick={onDismiss}>
              已阅
            </button>
          </div>
        </div>
      </div>

      {sortedNewIndices.map((index) => (
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

function formatDelta(delta: number) {
  if (Math.abs(delta) >= 1) return delta.toFixed(2);
  return delta.toFixed(3).replace("0.", ".");
}
