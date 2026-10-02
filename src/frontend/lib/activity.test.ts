import { describe, expect, it } from "vitest";
import type { UserSummary } from "@/lib/api/types";
import {
  activityHref,
  activityPath,
  actorPhrase,
  byRecency,
  noticeHref,
  readActivityFilter,
  withoutTitleLabel,
} from "./activity";

const member = (id: number, displayName: string): UserSummary => ({
  id,
  username: displayName.toLowerCase(),
  displayName,
  avatarUrl: null,
});
const [nova, kai, lee] = [member(1, "Nova"), member(2, "Kai"), member(3, "Lee")];

describe("actorPhrase", () => {
  it("names one, two or three people", () => {
    expect(actorPhrase([nova], 1)).toBe("Nova");
    expect(actorPhrase([nova, kai], 2)).toBe("Nova and Kai");
    expect(actorPhrase([nova, kai, lee], 3)).toBe("Nova, Kai and Lee");
  });

  it("counts the rest past three", () => {
    expect(actorPhrase([nova, kai, lee], 4)).toBe("Nova, Kai and 2 others");
    expect(actorPhrase([nova, kai, lee], 12)).toBe("Nova, Kai and 10 others");
  });

  it("says one other in the singular", () => {
    expect(actorPhrase([nova], 2)).toBe("Nova and 1 other");
  });
});

describe("byRecency", () => {
  const now = Date.parse("2026-10-01T12:00:00Z");
  const at = (hoursAgo: number) => ({ at: new Date(now - hoursAgo * 3_600_000).toISOString() });

  it("splits a newest-first list into the last day, the last week and earlier", () => {
    const sections = byRecency([at(1), at(23), at(25), at(24 * 6), at(24 * 8)], now);
    expect(sections.map((section) => [section.recency, section.items.length])).toEqual([
      ["day", 2],
      ["week", 2],
      ["earlier", 1],
    ]);
  });

  it("leaves out sections with nothing in them", () => {
    expect(byRecency([at(24 * 30)], now).map((section) => section.recency)).toEqual(["earlier"]);
  });
});

describe("activityHref", () => {
  const nova = member(1, "Nova");
  const kai = member(2, "Kai");

  it("leads to the comment when there is one, otherwise the spark", () => {
    const like = { kind: "postLike" as const, actors: [nova], count: 1 };
    expect(activityHref({ ...like, postId: 4, commentId: null }, "me")).toBe("/p/4");
    expect(activityHref({ ...like, postId: 4, commentId: 9 }, "me")).toBe("/c/9");
  });

  it("leads to a new follower's profile, or to my followers when there were several", () => {
    const follow = { kind: "follow" as const, postId: null, commentId: null };
    expect(activityHref({ ...follow, actors: [nova], count: 1 }, "me")).toBe("/u/nova");
    expect(activityHref({ ...follow, actors: [kai, nova], count: 2 }, "me")).toBe("/u/me/followers");
  });
});

describe("noticeHref", () => {
  it("leads a live follow to the follower and anything else to what it's about", () => {
    const nova = member(1, "Nova");
    expect(noticeHref({ kind: "follow", actor: nova, postId: null, commentId: null, excerpt: null })).toBe("/u/nova");
    expect(noticeHref({ kind: "reply", actor: nova, postId: 4, commentId: 9, excerpt: "Hi" })).toBe("/c/9");
  });
});

describe("withoutTitleLabel", () => {
  it("drops the title label a titled spark starts with", () => {
    expect(withoutTitleLabel("Title: Low Tide\nA town…")).toBe("Low Tide\nA town…");
  });
});

describe("readActivityFilter", () => {
  it("knows likes, comments, replies and follows, and shows everything otherwise", () => {
    expect(readActivityFilter({ filter: "replies" })).toBe("replies");
    expect(readActivityFilter(new URLSearchParams("filter=likes"))).toBe("likes");
    expect(readActivityFilter({ filter: "follows" })).toBe("follows");
    expect(readActivityFilter({ filter: "mentions" })).toBeUndefined();
  });
});

describe("activityPath", () => {
  it("leaves everything bare and names a filter", () => {
    expect(activityPath(undefined)).toBe("/activity");
    expect(activityPath("comments")).toBe("/activity?filter=comments");
  });
});
