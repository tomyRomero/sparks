const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

/** "now", "5m", "3h", "2d", then "Sep 12" (with the year if it differs). */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const elapsed = now.getTime() - then.getTime();
  if (elapsed < minute) return "now";
  if (elapsed < hour) return `${Math.floor(elapsed / minute)}m`;
  if (elapsed < day) return `${Math.floor(elapsed / hour)}h`;
  if (elapsed < 7 * day) return `${Math.floor(elapsed / day)}d`;
  return shortDate(then, now);
}

export function fullDate(iso: string): string {
  return new Date(iso).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
}

/** timeAgo in a sentence: "5m ago" within the week, "on Sep 12" after, and `justNow` under a minute. */
export function agoPhrase(iso: string, justNow: string, now: Date = new Date()): string {
  const elapsed = now.getTime() - new Date(iso).getTime();
  if (elapsed < minute) return justNow;
  const age = timeAgo(iso, now);
  return elapsed < 7 * day ? `${age} ago` : `on ${age}`;
}

/** When someone was last around: "Active 12m ago", "Active 2d ago", "Active on Sep 12". */
export function lastActive(iso: string, now: Date = new Date()): string {
  return `Active ${agoPhrase(iso, "just now", now)}`;
}

/** Whether two moments fall on the same day, in the reader's time zone. */
export function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** "Today", "Yesterday", a weekday within the week, then the date. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const startOf = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const daysBack = Math.round((startOf(now) - startOf(then)) / day);
  if (daysBack === 0) return "Today";
  if (daysBack === 1) return "Yesterday";
  if (daysBack > 1 && daysBack < 7) return then.toLocaleDateString("en", { weekday: "long" });
  return shortDate(then, now);
}

/** "Sep 12", with the year when it isn't this one. */
function shortDate(then: Date, now: Date): string {
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
