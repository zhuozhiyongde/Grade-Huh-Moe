'use client';

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/time";

type RelativeTimeProps = {
  value: Date | number | null | undefined;
  prefix?: string;
  suffix?: string;
  fallback?: string;
  refreshIntervalMs?: number;
};

export function RelativeTime({
  value,
  prefix = "",
  suffix = "",
  fallback = "--",
  refreshIntervalMs = 30_000,
}: RelativeTimeProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!value) return;
    const timer = setInterval(() => setNow(Date.now()), refreshIntervalMs);
    return () => clearInterval(timer);
  }, [refreshIntervalMs, value]);

  if (!value) {
    return <span>{fallback}</span>;
  }

  const target = value instanceof Date ? value : new Date(value);
  const text = formatRelativeTime(target, now);
  return (
    <span>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
