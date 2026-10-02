import type { ActivityFilter, ActivityItem, ActivityKind, ActivityNotice, UserSummary } from "@/lib/api/types";
import { type ParamSource, paramValues } from "@/lib/params";

/** What each kind says after the names: "Nova liked your spark". */
export const activityVerbs: Record<ActivityKind, string> = {
  postLike: "liked your spark",
  commentLike: "liked your comment",
  comment: "commented on your spark",
  reply: "replied to your comment",
  follow: "followed you",
};

/**
 * Where an item leads: a new follower's profile, or the member's own
 * followers when there were several; the comment for anything about one;
 * otherwise the spark.
 */
export function activityHref(
  item: Pick<ActivityItem, "kind" | "actors" | "count" | "postId" | "commentId">,
  viewerUsername: string,
): string {
  if (item.kind === "follow") {
    return item.count === 1 && item.actors.length > 0
      ? `/u/${item.actors[0].username}`
      : `/u/${viewerUsername}/followers`;
  }
  return contentHref(item);
}

/** Where a live notice leads: the follower's profile, the comment, or the spark. */
export function noticeHref(notice: ActivityNotice): string {
  return notice.kind === "follow" ? `/u/${notice.actor.username}` : contentHref(notice);
}

function contentHref({ postId, commentId }: { postId: number | null; commentId: number | null }): string {
  return commentId === null ? `/p/${postId}` : `/c/${commentId}`;
}

/**
 * Who to name and how many to count for the rest: up to three people are
 * named ("Nova, Kai and Lee"); past that, two and the others as a number.
 */
export function namedActors(actors: readonly UserSummary[], count: number) {
  const named = actors.slice(0, count <= 3 ? count : 2);
  return { named, others: Math.max(0, count - named.length) };
}

export function othersPhrase(others: number): string {
  return others === 1 ? "1 other" : `${others} others`;
}

/** Each item with what comes before it in a sentence: nothing, ", ", or " and " for the last. */
export function inSentence<T>(items: readonly T[]): { item: T; before: string }[] {
  return items.map((item, index) => ({
    item,
    before: index === 0 ? "" : index === items.length - 1 ? " and " : ", ",
  }));
}

/** "Nova", "Nova and Kai", "Nova, Kai and Lee", "Nova, Kai and 10 others". */
export function actorPhrase(actors: readonly UserSummary[], count: number): string {
  const { named, others } = namedActors(actors, count);
  const names = named.map((actor) => actor.displayName);
  if (others > 0) names.push(othersPhrase(others));
  if (names.length === 0) return "Someone";
  return inSentence(names)
    .map(({ item, before }) => before + item)
    .join("");
}

const filters: readonly ActivityFilter[] = ["likes", "comments", "replies", "follows"];

/** The activity page's filter from its URL; everything when there's none it knows. */
export function readActivityFilter(params: ParamSource): ActivityFilter | undefined {
  const value = paramValues(params, "filter")[0];
  return filters.find((filter) => filter === value);
}

/** The page's URL for a filter, which is also the API's path for it. */
export function activityPath(filter: ActivityFilter | undefined): string {
  return filter ? `/activity?filter=${filter}` : "/activity";
}

export type Recency = "day" | "week" | "earlier";

export const recencyLabels: Record<Recency, string> = {
  day: "Last 24 hours",
  week: "Last 7 days",
  earlier: "Earlier",
};

const dayMs = 24 * 60 * 60 * 1000;

export function recency(at: string, now: number): Recency {
  const age = now - new Date(at).getTime();
  if (age < dayMs) return "day";
  if (age < 7 * dayMs) return "week";
  return "earlier";
}

/**
 * Splits a newest-first list into runs by age. Ages, not calendar days, so
 * the server and the browser agree on the sections whatever their time zones.
 */
export function byRecency<T extends { at: string }>(items: readonly T[], now: number) {
  const sections: { recency: Recency; items: T[] }[] = [];
  for (const item of items) {
    const section = recency(item.at, now);
    const last = sections.at(-1);
    if (last?.recency === section) last.items.push(item);
    else sections.push({ recency: section, items: [item] });
  }
  return sections;
}

/** Excerpts are opening words, so drop a titled spark's "Title: " label. */
export function withoutTitleLabel(text: string): string {
  return text.replace(/^Title:[ \t]*/, "");
}
