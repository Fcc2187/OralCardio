import { describe, expect, it } from "vitest";

import { HttpError } from "@/shared/api/httpClient";

import { translateCaregiverError } from "./caregiverErrorMessages";

describe("translateCaregiverError", () => {
  it("mapeia 404 para o próprio cadastro, não para o cuidador", () => {
    const message = translateCaregiverError(new HttpError("Usuário não encontrado", 404));

    expect(message).toBe("Não foi possível carregar seu cadastro. Recarregue a página e tente novamente.");
  });

  it("mapeia 409 para uma mensagem sobre convite duplicado", () => {
    const message = translateCaregiverError(new HttpError("Vínculo de cuidador já existe", 409));

    expect(message).toContain("já convidou esse e-mail");
  });

  it("dá orientação específica para e-mail não confirmado", () => {
    const message = translateCaregiverError(new HttpError("E-mail não confirmado", 422));

    expect(message).toContain("Confirme o e-mail");
  });

  it("repassa outras mensagens de 422 verbatim, por já serem pt-BR voltadas ao paciente", () => {
    const message = translateCaregiverError(
      new HttpError("Convite inválido, já utilizado, ou e-mail não corresponde", 422),
    );

    expect(message).toBe("Convite inválido, já utilizado, ou e-mail não corresponde");
  });

  it("usa a mensagem genérica para erros desconhecidos", () => {
    expect(translateCaregiverError(new Error("network down"))).toBe(
      "Algo deu errado. Tente novamente em instantes.",
    );
    expect(translateCaregiverError(new HttpError("Erro interno", 500))).toBe(
      "Algo deu errado. Tente novamente em instantes.",
    );
  });
});
