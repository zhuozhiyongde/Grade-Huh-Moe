const formatter = new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" });

const DIVISIONS: Array<[number, Intl.RelativeTimeFormatUnit]> = [
  [60, "second"],
  [60, "minute"],
  [24, "hour"],
  [7, "day"],
  [4.34524, "week"],
  [12, "month"],
  [Number.POSITIVE_INFINITY, "year"],
];

export function formatRelativeTime(target: number | Date, base = Date.now()) {
  const targetMs = target instanceof Date ? target.getTime() : target;
  let delta = (targetMs - base) / 1000;

  for (const [amount, unit] of DIVISIONS) {
    if (Math.abs(delta) < amount) {
      return formatter.format(Math.round(delta), unit);
    }
    delta /= amount;
  }
  return formatter.format(Math.round(delta), "year");
}
