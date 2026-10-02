import { describe, expect, it } from "vitest";
import { agoPhrase, dayLabel, lastActive, sameDay, timeAgo } from "./time";

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

describe("lastActive", () => {
  it.each([
    ["2026-09-30T11:59:30Z", "Active just now"],
    ["2026-09-30T11:48:00Z", "Active 12m ago"],
    ["2026-09-28T12:00:00Z", "Active 2d ago"],
    ["2026-09-12T12:00:00Z", "Active on Sep 12"],
  ])("shows %s as %s", (iso, expected) => {
    expect(lastActive(iso, now)).toBe(expected);
  });
});

describe("agoPhrase", () => {
  it.each([
    ["2026-09-30T11:59:30Z", "a moment ago"],
    ["2026-09-30T09:00:00Z", "3h ago"],
    ["2026-09-12T12:00:00Z", "on Sep 12"],
  ])("puts %s as %s", (iso, expected) => {
    expect(agoPhrase(iso, "a moment ago", now)).toBe(expected);
  });
});

// Built from local times, as the reader's clock sees them, so the tests pass in any time zone.
describe("dayLabel", () => {
  const noon = new Date(2026, 8, 30, 12, 0);
  const at = (month: number, date: number, hours = 9, year = 2026) => new Date(year, month, date, hours).toISOString();

  it.each([
    [at(8, 30, 0), "Today"],
    [at(8, 29, 23), "Yesterday"],
    [at(8, 26), "Saturday"],
    [at(8, 23), "Sep 23"],
    [at(11, 24, 9, 2025), "Dec 24, 2025"],
  ])("labels %s as %s", (iso, expected) => {
    expect(dayLabel(iso, noon)).toBe(expected);
  });
});

describe("sameDay", () => {
  it("compares calendar days, not 24-hour spans", () => {
    expect(sameDay(new Date(2026, 8, 30, 0, 5).toISOString(), new Date(2026, 8, 30, 23, 55).toISOString())).toBe(true);
    expect(sameDay(new Date(2026, 8, 29, 23, 55).toISOString(), new Date(2026, 8, 30, 0, 5).toISOString())).toBe(false);
  });
});
