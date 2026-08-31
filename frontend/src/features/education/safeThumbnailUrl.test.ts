import { describe, expect, it } from "vitest";

import { safeThumbnailUrl } from "./safeThumbnailUrl";

describe("safeThumbnailUrl", () => {
  it("aceita URLs https válidas", () => {
    expect(safeThumbnailUrl("https://example.com/image.webp")).toBe("https://example.com/image.webp");
  });

  it("rejeita URLs http inseguras", () => {
    expect(safeThumbnailUrl("http://example.com/image.webp")).toBeNull();
  });

  it("rejeita strings inválidas ou nulas", () => {
    expect(safeThumbnailUrl(null)).toBeNull();
    expect(safeThumbnailUrl(undefined)).toBeNull();
    expect(safeThumbnailUrl("not-a-url")).toBeNull();
    expect(safeThumbnailUrl("javascript:alert(1)")).toBeNull();
  });
});
