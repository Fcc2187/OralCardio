import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { SignInPage } from "./SignInPage";

const useAuthMock = vi.fn();
vi.mock("@/shared/auth/authContext", () => ({
  useAuth: () => useAuthMock(),
}));

describe("SignInPage", () => {
  it("starts Google sign-in while preserving the requested internal route", async () => {
    const signInWithGoogle = vi.fn().mockResolvedValue(undefined);
    useAuthMock.mockReturnValue({ signIn: vi.fn(), signInWithGoogle });

    render(
      <MemoryRouter initialEntries={[{ pathname: "/entrar", state: { from: { pathname: "/agenda" } }}]}>
        <SignInPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continuar com Google" }));

    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledWith("/agenda"));
  });
});
