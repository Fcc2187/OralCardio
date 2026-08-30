import { createEvent, fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByText("Esta senha é muito comum. Escolha outra senha.")).toBeInTheDocument();
    expect(screen.getByText("As senhas não coincidem.")).toBeInTheDocument();
  });

  it("exibe a lista de requisitos de senha e atualiza dinamicamente ao digitar", () => {
    renderPage();

    const password = screen.getByLabelText("Senha");
    expect(password).toHaveAttribute("minlength", "8");
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(password.getAttribute("aria-describedby")).toContain("signup-password-requirements");

    expect(screen.getByText("Sua senha precisa ter:")).toBeInTheDocument();
    expect(screen.getByText("8+ caracteres")).toBeInTheDocument();
    expect(screen.getByText("Maiúscula e minúscula")).toBeInTheDocument();
    expect(screen.getByText("Um número")).toBeInTheDocument();
    expect(screen.getByText("Um caractere especial")).toBeInTheDocument();
    expect(screen.getByText("Senhas muito comuns não são aceitas.")).toBeInTheDocument();

    const requirementsContainer = document.getElementById("signup-password-requirements");
    expect(requirementsContainer).toHaveAttribute("aria-live", "polite");

    expect(screen.getAllByText("(não atendido)")).toHaveLength(4);

    fireEvent.change(password, { target: { value: "MinhaSenha!2026" } });
    expect(screen.getAllByText("(atendido)")).toHaveLength(4);
    expect(screen.queryByText("(não atendido)")).not.toBeInTheDocument();
  });

  it("does not block pasting a strong password", () => {
    renderPage();

    const password = screen.getByLabelText("Senha");
    const paste = createEvent.paste(password, {
      clipboardData: { getData: () => "MinhaSenha!2026" },
    });
    fireEvent(password, paste);

    expect(paste.defaultPrevented).toBe(false);
  });

  it("keeps the confirmation state in the auth layout", async () => {
    useAuthMock.mockReturnValue({ signUp: vi.fn().mockResolvedValue({ needsEmailConfirmation: true }) });
    renderPage();

    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "Ana Silva" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ana@example.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "MinhaSenha!2026" } });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "MinhaSenha!2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByRole("heading", { name: "Quase lá" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para entrar" })).toHaveAttribute("href", "/entrar");
  });
});
