import { describe, expect, it } from "vitest";
import { AVATAR_MAX_BYTES, imageProblem, POST_IMAGE_MAX_BYTES } from "./images";

const file = (type: string, size: number) => new File([new Uint8Array(size)], "picture", { type });

describe("imageProblem", () => {
  it.each(["image/png", "image/jpeg", "image/gif", "image/webp"])("accepts %s", (type) => {
    expect(imageProblem(file(type, 1024), POST_IMAGE_MAX_BYTES)).toBeNull();
  });

  it.each(["image/svg+xml", "image/heic", "application/pdf", ""])("turns down %s", (type) => {
    expect(imageProblem(file(type, 1024), POST_IMAGE_MAX_BYTES)).toBe("Pictures must be PNG, JPEG, GIF or WebP.");
  });

  it("turns down an empty file", () => {
    expect(imageProblem(file("image/png", 0), POST_IMAGE_MAX_BYTES)).toBe("That file is empty.");
  });

  it("allows exactly the limit and nothing over it", () => {
    expect(imageProblem(file("image/png", POST_IMAGE_MAX_BYTES), POST_IMAGE_MAX_BYTES)).toBeNull();
    expect(imageProblem(file("image/png", POST_IMAGE_MAX_BYTES + 1), POST_IMAGE_MAX_BYTES)).toBe(
      "That picture is 5.1 MB. Pictures can be up to 5 MB.",
    );
  });

  it("says how big a picture over the limit is", () => {
    expect(imageProblem(file("image/jpeg", 3.4 * 1024 * 1024), AVATAR_MAX_BYTES)).toBe(
      "That picture is 3.4 MB. Pictures can be up to 2 MB.",
    );
  });
});
