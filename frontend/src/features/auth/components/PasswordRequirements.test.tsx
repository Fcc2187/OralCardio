import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordRequirements } from "./PasswordRequirements";

describe("PasswordRequirements", () => {
  it("renderiza o cabeçalho e todos os 4 requisitos como não atendidos quando a senha está vazia", () => {
    render(<PasswordRequirements password="" />);

    expect(screen.getByText("Sua senha precisa ter:")).toBeInTheDocument();
    expect(screen.getByText("8+ caracteres")).toBeInTheDocument();
    expect(screen.getByText("Maiúscula e minúscula")).toBeInTheDocument();
    expect(screen.getByText("Um número")).toBeInTheDocument();
    expect(screen.getByText("Um caractere especial")).toBeInTheDocument();

    const unmetTags = screen.getAllByText("(não atendido)");
    expect(unmetTags).toHaveLength(4);
  });

  it("atualiza os indicadores para atendido conforme os critérios são satisfeitos", () => {
    const { rerender } = render(<PasswordRequirements password="Abcdefgh" />);

    expect(screen.getAllByText("(atendido)")).toHaveLength(2); // 8+ chars e maiuscula/minuscula
    expect(screen.getAllByText("(não atendido)")).toHaveLength(2); // numero e especial

    rerender(<PasswordRequirements password="Abcdefgh1" />);
    expect(screen.getAllByText("(atendido)")).toHaveLength(3); // 8+ chars, maiuscula/minuscula, numero
    expect(screen.getAllByText("(não atendido)")).toHaveLength(1); // especial

    rerender(<PasswordRequirements password="Abcdefgh1!" />);
    expect(screen.getAllByText("(atendido)")).toHaveLength(4);
    expect(screen.queryByText("(não atendido)")).not.toBeInTheDocument();
  });
});
