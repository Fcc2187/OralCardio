import { afterEach, describe, expect, it } from "vitest";

import { consumeOAuthReturnPath, saveOAuthReturnPath } from "./oauthReturnPath";

afterEach(() => {
  sessionStorage.clear();
});

describe("OAuth return path", () => {
  it("uses the saved internal path after the provider callback", () => {
    saveOAuthReturnPath("/agenda/nova");

    expect(consumeOAuthReturnPath()).toBe("/agenda/nova");
  });

  it("rejects an external protocol-relative path", () => {
    saveOAuthReturnPath("//example.com");

    expect(consumeOAuthReturnPath()).toBe("/");
  });

  it("rejects a backslash path normalized by browsers as an external URL", () => {
    saveOAuthReturnPath("/\\example.com");

    expect(consumeOAuthReturnPath()).toBe("/");
  });
});
