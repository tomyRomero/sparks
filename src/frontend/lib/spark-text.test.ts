import { describe, expect, it } from "vitest";
import { haikuLines, sparkPreview, splitSpark } from "./spark-text";

describe("splitSpark", () => {
  it("lifts the title out of a movie script, book plot or artwork", () => {
    expect(splitSpark("movieScript", "Title: The Last Signal\n\nA keeper hears a dead station.")).toEqual({
      title: "The Last Signal",
      text: "A keeper hears a dead station.",
      punchline: null,
    });
    expect(splitSpark("artwork", "Title:  Tide Clock  \nOil on linen.").title).toBe("Tide Clock");
  });

  it("keeps a title with nothing after it", () => {
    expect(splitSpark("bookPlot", "Title: Salt and Static")).toEqual({
      title: "Salt and Static",
      text: "",
      punchline: null,
    });
  });

  it("leaves titles alone in kinds that don't have them", () => {
    expect(splitSpark("regular", "Title: not really\n\nJust a spark.").title).toBeNull();
  });

  it("splits a joke at its first blank line", () => {
    expect(splitSpark("joke", "I asked for something strong.\n\nShe handed me the Wi-Fi password.")).toEqual({
      title: null,
      text: "I asked for something strong.",
      punchline: "She handed me the Wi-Fi password.",
    });
    expect(splitSpark("joke", "Setup\n  \nPunch\n\nline").punchline).toBe("Punch\n\nline");
  });

  it("shows a joke without a blank line whole", () => {
    expect(splitSpark("joke", "Why did the developer go broke? Cache.")).toEqual({
      title: null,
      text: "Why did the developer go broke? Cache.",
      punchline: null,
    });
  });
});

describe("haikuLines", () => {
  it("drops blank lines and stray spaces", () => {
    expect(haikuLines(" Autumn wind at dusk\n\nthe streetlights blink\nby one \n")).toEqual([
      "Autumn wind at dusk",
      "the streetlights blink",
      "by one",
    ]);
  });
});

describe("sparkPreview", () => {
  it("prefers the title and never gives away a punchline", () => {
    expect(sparkPreview("movieScript", "Title: The Last Signal\n\nA long logline.", 40)).toBe("The Last Signal");
    expect(sparkPreview("joke", "Setup line.\n\nThe punchline.", 40)).toBe("Setup line.");
  });
});
