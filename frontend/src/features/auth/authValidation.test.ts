import { describe, expect, it } from "vitest";

import {
  checkPasswordRequirements,
  validateNewPasswordFields,
  validatePasswordResetRequestFields,
  validateSignInFields,
  validateSignUpFields,
} from "./authValidation";

const commonPasswords = [
  "password", "123456", "12345678", "1234", "qwerty", "12345", "dragon", "pussy",
  "baseball", "football", "letmein", "monkey", "696969", "abc123", "mustang", "michael",
  "shadow", "master", "jennifer", "111111", "2000", "jordan", "superman", "harley",
  "1234567", "fuckme", "hunter", "fuckyou", "trustno1", "ranger",
];

function signUpFields(password: string) {
  return {
    fullName: "Ana Silva",
    email: "ana@example.com",
    password,
    confirmPassword: password,
  };
}

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

  it("validates a password reset e-mail", () => {
    expect(validatePasswordResetRequestFields({ email: "invalido" })).toEqual({
      email: "Informe um e-mail válido.",
    });
    expect(
      validatePasswordResetRequestFields({ email: " paciente@oralcardio.com " }),
    ).toEqual({});
  });

  it("applies the sign-up password policy to password recovery", () => {
    expect(
      validateNewPasswordFields({ password: "fraca", confirmPassword: "outra" }),
    ).toEqual({
      password: "A senha precisa ter pelo menos 8 caracteres.",
      confirmPassword: "As senhas não coincidem.",
    });
    expect(
      validateNewPasswordFields({
        password: "MinhaSenha!2026",
        confirmPassword: "MinhaSenha!2026",
      }),
    ).toEqual({});
  });

  it("requires at least 8 characters for sign-up", () => {
    expect(
      validateSignUpFields({
        fullName: "Ana Silva",
        email: "ana@example.com",
        password: "Abcdef!",
        confirmPassword: "Abcdef!",
      }),
    ).toEqual({
      password: "A senha precisa ter pelo menos 8 caracteres.",
    });
  });

  it("requires an uppercase letter for sign-up", () => {
    expect(
      validateSignUpFields({
        fullName: "Ana Silva",
        email: "ana@example.com",
        password: "minhasenha!",
        confirmPassword: "minhasenha!",
      }),
    ).toEqual({ password: "Inclua pelo menos uma letra maiúscula." });
  });

  it("requires a lowercase letter for sign-up", () => {
    expect(
      validateSignUpFields({
        fullName: "Ana Silva",
        email: "ana@example.com",
        password: "MINHASENHA!2026",
        confirmPassword: "MINHASENHA!2026",
      }),
    ).toEqual({ password: "Inclua pelo menos uma letra minúscula." });
  });

  it("requires a digit for sign-up", () => {
    expect(
      validateSignUpFields({
        fullName: "Ana Silva",
        email: "ana@example.com",
        password: "MinhaSenha!",
        confirmPassword: "MinhaSenha!",
      }),
    ).toEqual({ password: "Inclua pelo menos um número." });
  });

  it("requires a special character for sign-up", () => {
    expect(
      validateSignUpFields({
        fullName: "Ana Silva",
        email: "ana@example.com",
        password: "MinhaSenha2026",
        confirmPassword: "MinhaSenha2026",
      }),
    ).toEqual({ password: "Inclua pelo menos um caractere especial." });
  });

  it.each(commonPasswords)("rejects the selected common password %s", (password) => {
    expect(validateSignUpFields(signUpFields(password))).toEqual({
      password: "Esta senha é muito comum. Escolha outra senha.",
    });
  });

  it("rejects an all-numeric password outside the shortlist", () => {
    expect(validateSignUpFields(signUpFields("987654321"))).toEqual({
      password: "Inclua pelo menos uma letra maiúscula.",
    });
  });

  it("accepts a strong password with spaces without trimming it", () => {
    expect(validateSignUpFields(signUpFields(" Minha Senha! 2026 "))).toEqual({});
  });

  it("accepts a password that meets the password policy", () => {
    expect(
      validateSignUpFields({
        fullName: "Ana Silva",
        email: "ana@example.com",
        password: "MinhaSenha!2026",
        confirmPassword: "MinhaSenha!2026",
      }),
    ).toEqual({});
  });

  describe("checkPasswordRequirements", () => {
    it("identifica corretamente cada requisito atendido ou não", () => {
      expect(checkPasswordRequirements("")).toEqual({
        hasMinLength: false,
        hasUpperAndLower: false,
        hasNumber: false,
        hasSpecialChar: false,
      });

      expect(checkPasswordRequirements("12345678")).toEqual({
        hasMinLength: true,
        hasUpperAndLower: false,
        hasNumber: true,
        hasSpecialChar: false,
      });

      expect(checkPasswordRequirements("SenhaForte")).toEqual({
        hasMinLength: true,
        hasUpperAndLower: true,
        hasNumber: false,
        hasSpecialChar: false,
      });

      expect(checkPasswordRequirements("Senha123")).toEqual({
        hasMinLength: true,
        hasUpperAndLower: true,
        hasNumber: true,
        hasSpecialChar: false,
      });

      expect(checkPasswordRequirements("Senha123!")).toEqual({
        hasMinLength: true,
        hasUpperAndLower: true,
        hasNumber: true,
        hasSpecialChar: true,
      });
    });
  });
});
