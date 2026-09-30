const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

/**
 * A compact age for timestamps in lists: "now", "5m", "3h", "2d", then the
 * date ("Sep 12", with the year once it's another year).
 */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const elapsed = now.getTime() - then.getTime();
  if (elapsed < minute) return "now";
  if (elapsed < hour) return `${Math.floor(elapsed / minute)}m`;
  if (elapsed < day) return `${Math.floor(elapsed / hour)}h`;
  if (elapsed < 7 * day) return `${Math.floor(elapsed / day)}d`;
  return then.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    ...(then.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}

/** The full date and time, for a tooltip or a <time> title. */
export function fullDate(iso: string): string {
  return new Date(iso).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
}
