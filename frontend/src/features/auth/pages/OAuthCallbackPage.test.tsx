import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveOAuthReturnPath } from "../oauthReturnPath";
import { OAuthCallbackPage } from "./OAuthCallbackPage";

const useAuthMock = vi.fn();
vi.mock("@/shared/auth/authContext", () => ({
  useAuth: () => useAuthMock(),
}));

describe("OAuthCallbackPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns an authenticated user to the saved internal path", async () => {
    saveOAuthReturnPath("/agenda");
    useAuthMock.mockReturnValue({ isLoading: false, session: { user: { id: "user-1" } } });

    render(
      <MemoryRouter initialEntries={["/auth/callback"]}>
        <Routes>
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
          <Route path="/agenda" element={<p>Agenda</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Agenda")).toBeInTheDocument());
  });

  it("clears the saved path when the callback finishes without a session", () => {
    saveOAuthReturnPath("/agenda");
    useAuthMock.mockReturnValue({ isLoading: false, session: null });

    render(
      <MemoryRouter initialEntries={["/auth/callback#error=access_denied"]}>
        <OAuthCallbackPage />
      </MemoryRouter>,
    );

    expect(sessionStorage).toHaveLength(0);
    expect(screen.getByText("Não foi possível entrar com Google")).toBeInTheDocument();
  });
});
