import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignInPage } from "./SignInPage";

const useAuthMock = vi.fn();
vi.mock("@/shared/auth/authContext", () => ({
  useAuth: () => useAuthMock(),
}));

function renderPage(initialEntries: Parameters<typeof MemoryRouter>[0]["initialEntries"] = undefined) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <SignInPage />
    </MemoryRouter>,
  );
}

describe("SignInPage", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ signIn: vi.fn() });
  });

  it("shows validation feedback beside each invalid field", () => {
    renderPage();

    const form = screen.getByRole("button", { name: "Entrar" }).closest("form");
    if (!form) throw new Error("Formulário de entrada não encontrado.");

    fireEvent.submit(form);

    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(screen.getByText("Informe sua senha.")).toBeInTheDocument();
  });

  it("links to password recovery", () => {
    renderPage();

    expect(screen.getByRole("link", { name: "Esqueceu sua senha?" })).toHaveAttribute(
      "href",
      "/esqueci-senha",
    );
  });

  it("confirms a completed password reset", () => {
    renderPage([{ pathname: "/entrar", state: { passwordReset: true } }]);

    expect(screen.getByText("Senha alterada com sucesso. Entre novamente.")).toBeInTheDocument();
  });
});
