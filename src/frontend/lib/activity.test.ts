import { describe, expect, it } from "vitest";
import type { UserSummary } from "@/lib/api/types";
import {
  activityHref,
  activityPath,
  actorPhrase,
  byRecency,
  namedActors,
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

describe("namedActors", () => {
  it("names two and counts the others once there are more than three", () => {
    expect(namedActors([nova, kai, lee], 5)).toEqual({ named: [nova, kai], others: 3 });
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
  it("leads to the comment when there is one, otherwise the spark", () => {
    expect(activityHref({ postId: 4, commentId: null })).toBe("/p/4");
    expect(activityHref({ postId: 4, commentId: 9 })).toBe("/c/9");
  });
});

describe("withoutTitleLabel", () => {
  it("drops the title label a titled spark starts with", () => {
    expect(withoutTitleLabel("Title: Low Tide\nA town…")).toBe("Low Tide\nA town…");
  });
});

describe("readActivityFilter", () => {
  it("knows likes, comments and replies, and shows everything otherwise", () => {
    expect(readActivityFilter({ filter: "replies" })).toBe("replies");
    expect(readActivityFilter(new URLSearchParams("filter=likes"))).toBe("likes");
    expect(readActivityFilter({ filter: "follows" })).toBeUndefined();
    expect(activityPath(undefined)).toBe("/activity");
    expect(activityPath("comments")).toBe("/activity?filter=comments");
  });
});
