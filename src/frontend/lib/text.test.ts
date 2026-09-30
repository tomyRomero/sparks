import { describe, expect, it } from "vitest";
import { excerpt } from "./text";

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
