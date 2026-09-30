import { describe, expect, it } from "vitest";
import { calculateTimeAgo, cn, isBase64Image } from "./utils";

describe("cn", () => {
  it("merges conflicting Tailwind classes, keeping the last", () => {
    expect(cn("p-2 text-sm", "p-4")).toBe("text-sm p-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});

describe("isBase64Image", () => {
  it("accepts image data URLs", () => {
    expect(isBase64Image("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
    expect(isBase64Image("data:image/jpeg;base64,/9j/4AAQ")).toBe(true);
  });

  it("rejects other strings", () => {
    expect(isBase64Image("https://example.com/cat.png")).toBe(false);
    expect(isBase64Image("data:text/plain;base64,aGVsbG8=")).toBe(false);
  });
});

describe("calculateTimeAgo", () => {
  // Stored timestamps look like "MM-DD-YYYY h:mm am/pm" in local time.
  const posted = "03-16-2024 10:00 pm";
  const at = (day: number, hour: number, minute: number) =>
    new Date(2024, 2, day, hour, minute);

  it("says just now within the first minute", () => {
    expect(calculateTimeAgo(at(16, 22, 0), posted)).toBe("just now");
  });

  it("counts minutes, hours and days with plurals", () => {
    expect(calculateTimeAgo(at(16, 22, 1), posted)).toBe("1 minute ago");
    expect(calculateTimeAgo(at(16, 22, 45), posted)).toBe("45 minutes ago");
    expect(calculateTimeAgo(at(16, 23, 0), posted)).toBe("1 hour ago");
    expect(calculateTimeAgo(at(18, 22, 0), posted)).toBe("2 days ago");
  });
});
