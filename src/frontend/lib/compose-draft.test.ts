import { describe, expect, it } from "vitest";
import { type ComposeDraft, DRAFT_IMAGE_KEEP_MS, hasContent, parseDraft } from "./compose-draft";

const now = Date.parse("2026-10-01T12:00:00Z");
const draft: ComposeDraft = {
  withAi: true,
  kind: "movieScript",
  idea: "A radio station that went quiet",
  draftedFrom: "A radio station that went quiet",
  body: "Title: Dead Air\n\nA night host keeps broadcasting to no one.",
  imagePrompt: "An empty studio, one red light",
  image: { key: "images/1/a.png", url: "/files/images/1/a.png", uploadedAt: now - 60_000 },
  savedAt: now - 30_000,
};

describe("parseDraft", () => {
  it("reads back what was saved", () => {
    expect(parseDraft(JSON.stringify(draft), now)).toEqual(draft);
  });

  it("drops a picture old enough to have been swept", () => {
    const old = { ...draft, image: { ...draft.image!, uploadedAt: now - DRAFT_IMAGE_KEEP_MS } };
    expect(parseDraft(JSON.stringify(old), now)?.image).toBeNull();
  });

  it("turns down anything that isn't a draft", () => {
    expect(parseDraft(null, now)).toBeNull();
    expect(parseDraft("not json", now)).toBeNull();
    expect(parseDraft(JSON.stringify({ ...draft, kind: "poem" }), now)).toBeNull();
    expect(parseDraft(JSON.stringify([draft]), now)).toBeNull();
  });

  it("never brings a plain spark back as an AI draft", () => {
    expect(parseDraft(JSON.stringify({ ...draft, kind: "regular" }), now)?.withAi).toBe(false);
  });

  it("caps the text at the API's limits", () => {
    expect(parseDraft(JSON.stringify({ ...draft, body: "x".repeat(20_000) }), now)?.body).toHaveLength(10_000);
  });
});

describe("hasContent", () => {
  it("counts words or a picture, not whitespace", () => {
    expect(hasContent({ body: "  \n", image: null })).toBe(false);
    expect(hasContent({ body: "", image: draft.image })).toBe(true);
  });
});
