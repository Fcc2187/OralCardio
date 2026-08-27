import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignUpPage } from "./SignUpPage";

const useAuthMock = vi.fn();
vi.mock("@/shared/auth/authContext", () => ({
  useAuth: () => useAuthMock(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <SignUpPage />
    </MemoryRouter>,
  );
}

describe("SignUpPage", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ signUp: vi.fn() });
  });

  it("shows validation feedback beside each invalid field", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invalido" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "12345" } });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "outra" } });

    const form = screen.getByRole("button", { name: "Criar conta" }).closest("form");
    if (!form) throw new Error("Formulário de cadastro não encontrado.");

    fireEvent.submit(form);

    expect(screen.getByText("Informe seu nome completo.")).toBeInTheDocument();
    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(screen.getByText("A senha precisa ter pelo menos 6 caracteres.")).toBeInTheDocument();
    expect(screen.getByText("As senhas não coincidem.")).toBeInTheDocument();
  });
});
