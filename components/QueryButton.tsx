'use client';

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOptions } from "@/context/OptionsContext";
import { GID_REGEX } from "@/lib/gid";

export function QueryButton() {
  const { username, mainPassword, medPassword, samePassword, gid, loading, load } = useAuth();
  const { mode } = useOptions();

  const canQuery = useMemo(() => {
    if (!username) return false;
    if ((mode === "main" || mode === "mixed") && !mainPassword) return false;
    const medPasswordToUse = samePassword ? mainPassword : medPassword;
    if ((mode === "med" || mode === "mixed") && !medPasswordToUse) return false;
    if (mode === "med" || mode === "mixed") {
      const normalizedGid = gid.trim();
      if (!normalizedGid || !GID_REGEX.test(normalizedGid)) {
        return false;
      }
    }
    return true;
  }, [gid, mainPassword, medPassword, mode, samePassword, username]);

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
