import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResetPasswordPage } from "./ResetPasswordPage";

const useAuthMock = vi.fn();
vi.mock("@/shared/auth/authContext", () => ({
  useAuth: () => useAuthMock(),
}));

function Destination() {
  const location = useLocation();
  return <p>{location.state?.passwordReset ? "Redefinição concluída" : "Sem confirmação"}</p>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/redefinir-senha"]}>
      <Routes>
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/entrar" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      isLoading: false,
      session: { user: { id: "test-user" } },
      signOut: vi.fn(),
      updatePassword: vi.fn(),
    });
  });

  it("waits for the recovery session bootstrap", () => {
    useAuthMock.mockReturnValue({ isLoading: true, session: null });
    renderPage();

    expect(screen.getByText("Validando link…")).toBeInTheDocument();
  });

  it("rejects an invalid or expired recovery link", () => {
    useAuthMock.mockReturnValue({ isLoading: false, session: null });
    renderPage();

    expect(
      screen.getByText("Este link de recuperação é inválido ou expirou."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Solicitar outro link" })).toHaveAttribute(
      "href",
      "/esqueci-senha",
    );
  });

  it("applies the password policy and confirmation", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "fraca" } });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "outra" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(screen.getByText("A senha precisa ter pelo menos 8 caracteres.")).toBeInTheDocument();
    expect(screen.getByText("As senhas não coincidem.")).toBeInTheDocument();
  });

  it("updates the password, signs out and returns to sign-in", async () => {
    const updatePassword = vi.fn().mockResolvedValue(undefined);
    const signOut = vi.fn().mockResolvedValue(undefined);
    useAuthMock.mockReturnValue({
      isLoading: false,
      session: { user: { id: "test-user" } },
      signOut,
      updatePassword,
    });
    renderPage();

    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "MinhaSenha!2026" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "MinhaSenha!2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    await waitFor(() => expect(updatePassword).toHaveBeenCalledWith("MinhaSenha!2026"));
    expect(signOut).toHaveBeenCalledOnce();
    expect(await screen.findByText("Redefinição concluída")).toBeInTheDocument();
  });
});
