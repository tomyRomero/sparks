import { describe, expect, it } from "vitest";
import { timeAgo } from "./time";

const now = new Date("2026-09-30T12:00:00Z");

describe("timeAgo", () => {
  it.each([
    ["2026-09-30T11:59:30Z", "now"],
    ["2026-09-30T11:55:00Z", "5m"],
    ["2026-09-30T09:00:00Z", "3h"],
    ["2026-09-28T12:00:00Z", "2d"],
    ["2026-09-12T12:00:00Z", "Sep 12"],
    ["2025-12-24T12:00:00Z", "Dec 24, 2025"],
  ])("shows %s as %s", (iso, expected) => {
    expect(timeAgo(iso, now)).toBe(expected);
  });
});
