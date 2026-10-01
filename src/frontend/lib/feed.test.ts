import { describe, expect, it } from "vitest";
import { feedHref, feedPath, readFeedFilter, sameFilter, toggleKind, unfiltered } from "./feed";

describe("readFeedFilter", () => {
  it("reads nothing as the plain newest-first feed", () => {
    expect(readFeedFilter({})).toEqual(unfiltered);
  });

  it("keeps known kinds once each, in the kinds list's order", () => {
    const params = { kind: ["joke", "haiku", "nonsense", "joke"], sort: "top", pictures: "1" };
    expect(readFeedFilter(params)).toEqual({ kinds: ["haiku", "joke"], sort: "top", pictures: true, following: false });
  });

  it("reads the browser's search params the same way", () => {
    const params = new URLSearchParams("kind=quote&kind=artwork&sort=newest&pictures=yes");
    expect(readFeedFilter(params)).toEqual({
      kinds: ["artwork", "quote"],
      sort: "newest",
      pictures: false,
      following: false,
    });
  });

  it("reads Following for members only", () => {
    expect(readFeedFilter({ feed: "following" }).following).toBe(true);
    expect(readFeedFilter({ feed: "following" }, false).following).toBe(false);
    expect(readFeedFilter({ feed: "everyone" }).following).toBe(false);
  });
});

describe("feedHref and feedPath", () => {
  const filter = { kinds: ["haiku" as const, "joke" as const], sort: "top" as const, pictures: true, following: true };

  it("leaves the plain feed's URL bare", () => {
    expect(feedHref(unfiltered)).toBe("/");
    expect(feedPath(unfiltered)).toBe("/posts");
  });

  it("puts every filter in the page URL", () => {
    expect(feedHref(filter)).toBe("/?feed=following&kind=haiku&kind=joke&sort=top&pictures=1");
  });

  it("asks the top endpoint for the Top sort, with the API's parameter names", () => {
    expect(feedPath(filter)).toBe("/posts/top?kind=haiku&kind=joke&pictures=true&following=true");
  });

  it("round-trips through the URL", () => {
    const url = new URL(feedHref(filter), "https://sparks.test");
    expect(readFeedFilter(url.searchParams)).toEqual(filter);
  });
});

describe("toggleKind", () => {
  it("adds a kind in the kinds list's order and removes it again", () => {
    const added = toggleKind(["joke"], "haiku");
    expect(added).toEqual(["haiku", "joke"]);
    expect(toggleKind(added, "joke")).toEqual(["haiku"]);
  });
});

describe("sameFilter", () => {
  it("compares by what the filter shows", () => {
    expect(sameFilter({ ...unfiltered, kinds: ["haiku"] }, { ...unfiltered, kinds: ["haiku"] })).toBe(true);
    expect(sameFilter(unfiltered, { ...unfiltered, sort: "top" })).toBe(false);
  });
});
