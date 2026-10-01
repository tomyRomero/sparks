import { describe, expect, it } from "vitest";
import { memberSearchPath, readSearch, searchHref, sparkSearchPath } from "./search";

describe("readSearch", () => {
  it("trims the term and caps it like the API", () => {
    expect(readSearch({ q: `  ${"x".repeat(120)}  ` }).q).toHaveLength(100);
  });

  it("reads the members tab and the sparks tab's kinds", () => {
    expect(readSearch({ q: "nova", type: "members" })).toEqual({ q: "nova", tab: "members", kinds: [] });
    expect(readSearch(new URLSearchParams("q=tide&kind=joke&kind=haiku"))).toEqual({
      q: "tide",
      tab: "sparks",
      kinds: ["haiku", "joke"],
    });
  });
});

describe("searchHref", () => {
  it("keeps kinds for sparks only", () => {
    expect(searchHref({ q: "tide", tab: "sparks", kinds: ["haiku"] })).toBe("/search?q=tide&kind=haiku");
    expect(searchHref({ q: "nova", tab: "members", kinds: ["haiku"] })).toBe("/search?q=nova&type=members");
  });

  it("is bare before anything is searched", () => {
    expect(searchHref({ q: "", tab: "sparks", kinds: [] })).toBe("/search");
  });
});

describe("API paths", () => {
  it("encodes the term", () => {
    expect(sparkSearchPath("rain & sun", ["quote"])).toBe("/posts?q=rain+%26+sun&kind=quote");
    expect(memberSearchPath("o'neil")).toBe("/users?q=o%27neil");
  });
});
