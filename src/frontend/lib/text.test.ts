import { describe, expect, it } from "vitest";
import { excerpt, matchParts } from "./text";

describe("excerpt", () => {
  it("leaves a short text alone, on one line", () => {
    expect(excerpt("Rain on\n  the window", 40)).toBe("Rain on the window");
  });

  it("cuts a long text at a word and adds an ellipsis", () => {
    expect(excerpt("An old fisherman mending nets in a doorway", 20)).toBe("An old fisherman…");
  });

  it("cuts mid-word when the only break would lose most of the text", () => {
    expect(excerpt("A supercalifragilisticexpialidocious day", 20)).toBe("A supercalifragilis…");
  });

  it("never goes past the limit", () => {
    expect(excerpt("x".repeat(100), 10)).toHaveLength(10);
  });
});

describe("matchParts", () => {
  it("marks every place the term appears, whatever its case", () => {
    expect(matchParts("Rain, rain, go away", "RAIN")).toEqual([
      { text: "Rain", match: true },
      { text: ", ", match: false },
      { text: "rain", match: true },
      { text: ", go away", match: false },
    ]);
  });

  it("treats the term as plain text, not a pattern", () => {
    expect(matchParts("What? (Really.)", "(really.)")).toEqual([
      { text: "What? ", match: false },
      { text: "(Really.)", match: true },
    ]);
  });

  it("leaves the text whole with no term or no match", () => {
    expect(matchParts("Low tide", "  ")).toEqual([{ text: "Low tide", match: false }]);
    expect(matchParts("Low tide", "moon")).toEqual([{ text: "Low tide", match: false }]);
  });
});
