'use client';

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOptions } from "@/context/OptionsContext";

export function QueryButton() {
  const { username, mainPassword, medPassword, samePassword, loading, load } = useAuth();
  const { mode } = useOptions();

  const canQuery = useMemo(() => {
    if (!username) return false;
    if ((mode === "main" || mode === "mixed") && !mainPassword) return false;
    const medPasswordToUse = samePassword ? mainPassword : medPassword;
    if ((mode === "med" || mode === "mixed") && !medPasswordToUse) return false;
    return true;
  }, [mainPassword, medPassword, mode, samePassword, username]);

  const label = loading ? "查询中…" : canQuery ? "查询" : "请先登录";

  return (
    <div className="osu-frame">
      <button
        type="button"
        className="osu-button"
        disabled={loading || !canQuery}
        onClick={() => {
          void load();
        }}
      >
        {label}
      </button>
      <p className="osu-text">点击按钮查询成绩</p>
    </div>
  );
}
