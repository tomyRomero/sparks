import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./return-path";

describe("safeReturnPath", () => {
  it("keeps a path on this site", () => {
    expect(safeReturnPath("/messages?c=4")).toBe("/messages?c=4");
  });

  it.each([null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"])(
    "sends %s home instead",
    (next) => {
      expect(safeReturnPath(next)).toBe("/");
    },
  );
});
