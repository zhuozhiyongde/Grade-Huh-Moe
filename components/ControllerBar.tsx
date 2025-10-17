'use client';

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOptions } from "@/context/OptionsContext";
import { RelativeTime } from "@/components/RelativeTime";

const AUTO_RELOAD_INTERVAL_MS = 300_000;

export function ControllerBar() {
  const { load } = useAuth();
  const { hideText, judgeByGpa, toggleHideText, toggleJudgeByGpa } = useOptions();

  const [autoReloadEnabled, setAutoReloadEnabled] = useState(false);
  const [nextUpdate, setNextUpdate] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const toggleAutoReload = () => {
    if (autoReloadEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = null;
      setAutoReloadEnabled(false);
      setNextUpdate(null);
      return;
    }

    const scheduleNext = () => {
      setNextUpdate(Date.now() + AUTO_RELOAD_INTERVAL_MS);
    };

    scheduleNext();
    intervalRef.current = setInterval(() => {
      load().catch((error) => console.error("Auto reload failed", error));
      scheduleNext();
    }, AUTO_RELOAD_INTERVAL_MS);
    setAutoReloadEnabled(true);
  };

  return (
    <p className="controller-bar print-hide">
      <button
        type="button"
        onClick={toggleAutoReload}
        className="controller-link"
      >
        <span className="icon icon-refresh" />
        {autoReloadEnabled ? (
          <RelativeTime
            value={nextUpdate}
            refreshIntervalMs={1_000}
            suffix=" 刷新"
            fallback="即将刷新"
          />
        ) : (
          <span>自动刷新</span>
        )}
      </button>
      <button
        type="button"
        onClick={toggleHideText}
        className="controller-link"
      >
        <span className={`icon ${hideText ? "icon-show" : "icon-hide"}`} />
        <span>{hideText ? "显示文字" : "隐藏文字"}</span>
      </button>
      <button
        type="button"
        onClick={toggleJudgeByGpa}
        className="controller-link"
        title={
          judgeByGpa
            ? "当前四分制着色，GPA 从 1 至 4 由红变绿"
            : "当前百分制着色，分数从 60 至 100 由红变绿"
        }
      >
        <span className="icon icon-display" />
        <span>{judgeByGpa ? "百分制着色" : "四分制着色"}</span>
      </button>
    </p>
  );
}
