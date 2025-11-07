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
    <div className="text-center mt-4">
      <button
        type="button"
        className="h-40 w-40 my-4 mx-4 text-[2em] transition-[transform,opacity] duration-150 bg-[hsl(120,80%,50%)] text-white shadow-[0_0_3px_black] border-[5px] border-solid border-white rounded-full cursor-pointer outline-none hover:scale-[1.2] active:scale-100 active:translate-y-[0.2em] active:opacity-90 disabled:scale-[0.8] disabled:opacity-60 disabled:cursor-not-allowed [text-shadow:0_0_3px_black]"
        disabled={loading || !canQuery}
        onClick={() => {
          void load();
        }}
      >
        {label}
      </button>
      <p className="text-[0.9rem] opacity-80">点击按钮查询成绩</p>
    </div>
  );
}
