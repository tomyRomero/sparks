import { describe, expect, it } from "vitest";
import { isId } from "./ids";

describe("isId", () => {
  it.each(["1", "42", "999999999999999999"])("accepts %s", (value) => {
    expect(isId(value)).toBe(true);
  });

  it.each(["0", "007", "-1", "1.5", "abc", "", "1e3", "9999999999999999999"])("rejects %s", (value) => {
    expect(isId(value)).toBe(false);
  });
});
