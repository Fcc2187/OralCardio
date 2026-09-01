import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForgotPasswordPage } from "./ForgotPasswordPage";

const useAuthMock = vi.fn();
vi.mock("@/shared/auth/authContext", () => ({
  useAuth: () => useAuthMock(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ requestPasswordReset: vi.fn() });
  });

  it("validates the e-mail before requesting recovery", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invalido" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar instruções" }));

    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
  });

  it("normalizes the e-mail and shows a neutral response", async () => {
    const requestPasswordReset = vi.fn().mockResolvedValue(undefined);
    useAuthMock.mockReturnValue({ requestPasswordReset });
    renderPage();

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: " ana@example.com " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar instruções" }));

    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith("ana@example.com"));
    expect(
      screen.getByText(
        "Se existir uma conta para este e-mail, enviaremos as instruções de recuperação.",
      ),
    ).toBeInTheDocument();
  });

  it("prevents duplicate requests while sending", async () => {
    const requestPasswordReset = vi.fn().mockReturnValue(new Promise(() => {}));
    useAuthMock.mockReturnValue({ requestPasswordReset });
    renderPage();

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar instruções" }));

    expect(await screen.findByRole("button", { name: "Enviando…" })).toBeDisabled();
    expect(requestPasswordReset).toHaveBeenCalledOnce();
  });

  it("translates provider errors without exposing their details", async () => {
    const requestPasswordReset = vi.fn().mockRejectedValue(
      Object.assign(new Error("Provider details"), { code: "over_email_send_rate_limit" }),
    );
    useAuthMock.mockReturnValue({ requestPasswordReset });
    renderPage();

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar instruções" }));

    expect(
      await screen.findByText("Muitas tentativas. Aguarde alguns instantes e tente novamente."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Provider details")).not.toBeInTheDocument();
  });
});
