import { describe, expect, it } from "vitest";

import { validateSignInFields, validateSignUpFields } from "./authValidation";

describe("authValidation", () => {
  it("reports each invalid login field", () => {
    expect(validateSignInFields({ email: "invalido", password: "" })).toEqual({
      email: "Informe um e-mail válido.",
      password: "Informe sua senha.",
    });
  });

  it("accepts valid login fields after trimming the e-mail", () => {
    expect(validateSignInFields({ email: " paciente@oralcardio.com ", password: "segredo" })).toEqual({});
  });

  it("reports the existing sign-up rules by field", () => {
    expect(
      validateSignUpFields({
        fullName: "  ",
        email: "invalido",
        password: "12345",
        confirmPassword: "outra",
      }),
    ).toEqual({
      fullName: "Informe seu nome completo.",
      email: "Informe um e-mail válido.",
      password: "A senha precisa ter pelo menos 6 caracteres.",
      confirmPassword: "As senhas não coincidem.",
    });
  });
});
