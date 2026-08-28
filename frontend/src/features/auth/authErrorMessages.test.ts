import { describe, expect, it } from "vitest";

import { translateAuthError } from "./authErrorMessages";

function weakPasswordError(reasons: string[]) {
  return Object.assign(new Error("Password is weak."), { code: "weak_password", reasons });
}

describe("translateAuthError", () => {
  it("translates a weak password length error", () => {
    expect(translateAuthError(weakPasswordError(["length"]))).toBe(
      "A senha precisa ter pelo menos 8 caracteres.",
    );
  });

  it("translates a weak password character error", () => {
    expect(translateAuthError(weakPasswordError(["characters"]))).toBe(
      "Inclua letras maiúsculas e minúsculas, um número e um caractere especial.",
    );
  });

  it("translates a leaked password error", () => {
    expect(translateAuthError(weakPasswordError(["pwned"]))).toBe(
      "Esta senha é muito comum ou já foi comprometida.",
    );
  });

  it("translates a rate limit error", () => {
    expect(translateAuthError(Object.assign(new Error("Rate limit exceeded."), {
      code: "over_request_rate_limit",
    }))).toBe("Muitas tentativas. Aguarde alguns instantes e tente novamente.");
  });

  it("translates an e-mail rate limit error", () => {
    expect(translateAuthError(Object.assign(new Error("Rate limit exceeded."), {
      code: "over_email_send_rate_limit",
    }))).toBe("Muitas tentativas. Aguarde alguns instantes e tente novamente.");
  });

  it("translates a validation error without exposing the provider message", () => {
    expect(translateAuthError(Object.assign(new Error("Provider detail"), {
      code: "validation_failed",
    }))).toBe("Os dados informados não atendem aos requisitos de segurança.");
  });
});
