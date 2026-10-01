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

/** When someone was last around: "Active 12m ago", "Active 2d ago", "Active Sep 12". */
export function lastActive(iso: string, now: Date = new Date()): string {
  const age = timeAgo(iso, now);
  if (age === "now") return "Active just now";
  return /^\d+[mhd]$/.test(age) ? `Active ${age} ago` : `Active ${age}`;
}

/** Whether two moments fall on the same day, in the reader's time zone. */
export function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/**
 * The day a chat's messages were sent, for the line between days: "Today",
 * "Yesterday", the weekday within the last week, then the date.
 */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const startOf = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const daysBack = Math.round((startOf(now) - startOf(then)) / day);
  if (daysBack === 0) return "Today";
  if (daysBack === 1) return "Yesterday";
  if (daysBack > 1 && daysBack < 7) return then.toLocaleDateString("en", { weekday: "long" });
  return then.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    ...(then.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}

/** The time of day, for a message: "9:02 PM". */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}
