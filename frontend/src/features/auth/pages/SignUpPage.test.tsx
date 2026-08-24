import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { SignUpPage } from "./SignUpPage";

const useAuthMock = vi.fn();
vi.mock("@/shared/auth/authContext", () => ({
  useAuth: () => useAuthMock(),
}));

describe("SignUpPage", () => {
  it("offers Google sign-up", async () => {
    const signInWithGoogle = vi.fn().mockResolvedValue(undefined);
    useAuthMock.mockReturnValue({ signUp: vi.fn(), signInWithGoogle });

    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continuar com Google" }));

    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledWith());
  });
});
