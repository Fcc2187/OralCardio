import { describe, expect, it } from "vitest";

import { canEditPermissions } from "./caregiverStatus";

describe("canEditPermissions", () => {
  it("permite editar permissões enquanto pendente (momento mais relevante, antes do aceite)", () => {
    expect(canEditPermissions("pending")).toBe(true);
  });

  it("permite editar permissões enquanto ativo", () => {
    expect(canEditPermissions("active")).toBe(true);
  });

  it("desabilita a edição quando revogado (o PATCH não tem guard de estado)", () => {
    expect(canEditPermissions("revoked")).toBe(false);
  });
});
