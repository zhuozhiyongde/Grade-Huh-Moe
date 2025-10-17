'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useScoreContext } from "@/context/ScoreContext";
import { ScoreMode, useOptions } from "@/context/OptionsContext";
import type { ApiResult } from "@/lib/api";
import { fetchMainCampusScores } from "@/lib/isopClient";
import { fetchMedCampusScores, mergeScores } from "@/lib/pkuhscClient";
import { GID_REGEX } from "@/lib/gid";

type AuthContextValue = {
  username: string;
  mainPassword: string;
  medPassword: string;
  samePassword: boolean;
  gid: string;
  setUsername: (value: string) => void;
  setMainPassword: (value: string) => void;
  setMedPassword: (value: string) => void;
  setSamePassword: (value: boolean) => void;
  setGid: (value: string) => void;
  loading: boolean;
  load: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  username: "USERNAME",
  mainPassword: "MAIN_PASSWORD",
  medPassword: "MED_PASSWORD",
  samePassword: "USE_SAME_PASSWORD",
  gid: "PKUHSC_GID",
} as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loadScores, clear } = useScoreContext();
  const { mode } = useOptions();

  const [username, setUsername] = useState("");
  const [mainPassword, setMainPassword] = useState("");
  const [medPassword, setMedPassword] = useState("");
  const [gid, setGid] = useState("");
  const [samePassword, setSamePasswordState] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const storedUsername = localStorage.getItem(STORAGE_KEYS.username);
      const storedMainPassword = localStorage.getItem(STORAGE_KEYS.mainPassword);
      const storedMedPassword = localStorage.getItem(STORAGE_KEYS.medPassword);
      const storedSamePassword = localStorage.getItem(STORAGE_KEYS.samePassword);
      const storedGid = localStorage.getItem(STORAGE_KEYS.gid);
      if (storedUsername !== null) {
        setUsername(storedUsername);
      }
      if (storedMainPassword !== null) {
        setMainPassword(storedMainPassword);
      }
      if (storedMedPassword !== null) {
        setMedPassword(storedMedPassword);
      }
      if (storedGid !== null) {
        setGid(storedGid);
      }
      if (storedSamePassword === "1") {
        setSamePasswordState(true);
      } else if (storedSamePassword === "0") {
        setSamePasswordState(false);
      }
    } catch (error) {
      console.error("Failed to read stored credentials", error);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.has("username")) {
      setUsername(params.get("username") ?? "");
    }
    if (params.has("password")) {
      setMainPassword(params.get("password") ?? "");
    }
    if (params.has("medPassword")) {
      setMedPassword(params.get("medPassword") ?? "");
    }
    if (params.has("gid")) {
      setGid(params.get("gid") ?? "");
    }
  }, []);

  const setSamePassword = useCallback(
    (next: boolean) => {
      setSamePasswordState(next);
    },
    [],
  );

  useEffect(() => {
    if (mode !== "mixed") {
      setSamePassword(false);
    }
  }, [mode, setSamePassword]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.username, username);
    } catch (error) {
      console.error("Failed to persist username", error);
    }
  }, [username]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.mainPassword, mainPassword);
    } catch (error) {
      console.error("Failed to persist main password", error);
    }
  }, [mainPassword]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.medPassword, medPassword);
    } catch (error) {
      console.error("Failed to persist med password", error);
    }
  }, [medPassword]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.samePassword, samePassword ? "1" : "0");
    } catch (error) {
      console.error("Failed to persist same password flag", error);
    }
  }, [samePassword]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.gid, gid);
    } catch (error) {
      console.error("Failed to persist gid", error);
    }
  }, [gid]);

  const load = useCallback(async () => {
    const normalizedGid = gid.trim();
    const missing = collectMissingFields(mode, {
      username,
      mainPassword,
      medPassword,
      samePassword,
      gid: normalizedGid,
    });
    if (missing) {
      window.alert(missing);
      return;
    }

    setLoading(true);
    try {
      clear();
      const task = createLoadTask(mode, {
        username,
        mainPassword,
        medPassword,
        samePassword,
        gid: normalizedGid,
      });
      await loadScores(task);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      window.alert(message);
    } finally {
      setLoading(false);
    }
  }, [clear, gid, loadScores, mainPassword, medPassword, mode, samePassword, username]);

  const value = useMemo<AuthContextValue>(
    () => ({
      username,
      mainPassword,
      medPassword,
      gid,
      setUsername,
      samePassword,
      setMainPassword,
      setMedPassword,
      setSamePassword,
      setGid,
      loading,
      load,
    }),
    [gid, load, loading, mainPassword, medPassword, samePassword, setGid, setSamePassword, username],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

type Credentials = {
  username: string;
  mainPassword: string;
  medPassword: string;
  samePassword: boolean;
  gid: string;
};

function collectMissingFields(mode: ScoreMode, credentials: Credentials): string | null {
  const { username, mainPassword, medPassword, samePassword, gid } = credentials;
  if (!username) {
    return "请填写学号";
  }
  if ((mode === "main" || mode === "mixed") && !mainPassword) {
    return "请填写本部密码";
  }
  const medPasswordToUse = samePassword ? mainPassword : medPassword;
  if ((mode === "med" || mode === "mixed") && !medPasswordToUse) {
    return "请填写医学部密码";
  }
  if (mode === "med" || mode === "mixed") {
    if (!gid) {
      return "请填写 GID";
    }
    if (!GID_REGEX.test(gid)) {
      return "请填写有效的 GID（118 位大小写字母或数字）";
    }
  }
  return null;
}

type LoadTask = () => Promise<ApiResult>;

function createLoadTask(mode: ScoreMode, credentials: Credentials): LoadTask {
  const { username, mainPassword, medPassword, samePassword, gid } = credentials;
  const medPasswordToUse = samePassword ? mainPassword : medPassword;
  if (mode === "main") {
    return () => fetchMainCampusScores({ username, password: mainPassword });
  }
  if (mode === "med") {
    return () =>
      fetchMedCampusScores({
        username,
        password: medPasswordToUse,
        excludeMainCampus: false,
        gid,
      });
  }
  return async () => {
    const [main, med] = await Promise.all([
      fetchMainCampusScores({ username, password: mainPassword }),
      fetchMedCampusScores({
        username,
        password: medPasswordToUse,
        excludeMainCampus: true,
        gid,
      }),
    ]);
    return mergeScores(main, med);
  };
}
