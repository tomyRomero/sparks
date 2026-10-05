import { describe, expect, it } from "vitest";
import { groupChat } from "./chat";

// Local times, so midnight falls where the reader's clock puts it.
const at = (date: number, hours: number, minutes = 0) => new Date(2026, 8, date, hours, minutes).toISOString();
const from = (senderId: number, createdAt: string) => ({ senderId, createdAt });

describe("groupChat", () => {
  it("keeps one sender's quick messages in one run", () => {
    const days = groupChat([from(1, at(30, 9, 0)), from(1, at(30, 9, 3)), from(2, at(30, 9, 4))]);

    expect(days).toHaveLength(1);
    expect(days[0].runs.map((run) => [run.senderId, run.messages.length])).toEqual([
      [1, 2],
      [2, 1],
    ]);
  });

  it("starts a new run after a five-minute pause", () => {
    const days = groupChat([from(1, at(30, 9, 0)), from(1, at(30, 9, 5)), from(1, at(30, 9, 6))]);

    expect(days[0].runs.map((run) => run.messages.length)).toEqual([1, 2]);
  });

  it("starts a new day at midnight, even mid-conversation", () => {
    const days = groupChat([from(1, at(29, 23, 58)), from(1, at(30, 0, 1))]);

    expect(days).toHaveLength(2);
    expect(days.map((day) => day.runs.length)).toEqual([1, 1]);
  });

  it("has nothing to group in an empty conversation", () => {
    expect(groupChat([])).toEqual([]);
  });
});
