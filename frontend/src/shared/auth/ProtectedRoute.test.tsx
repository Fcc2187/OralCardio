import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "./ProtectedRoute";

const useAuthMock = vi.fn();
vi.mock("./authContext", () => ({
  useAuth: () => useAuthMock(),
}));

const useHealthProfileQueryMock = vi.fn();
vi.mock("@/shared/hooks/useHealthProfileQuery", () => ({
  useHealthProfileQuery: () => useHealthProfileQueryMock(),
}));

function renderProtected(requireCompletedProfile?: boolean) {
  return render(
    <MemoryRouter initialEntries={["/protegido"]}>
      <Routes>
        <Route element={<ProtectedRoute requireCompletedProfile={requireCompletedProfile} />}>
          <Route path="/protegido" element={<div>Conteúdo protegido</div>} />
        </Route>
        <Route path="/entrar" element={<div>Tela de entrar</div>} />
        <Route path="/questionario" element={<div>Tela de questionário</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useHealthProfileQueryMock.mockReturnValue({ isPending: false, data: { is_completed: true } });
  });

  it("redirects to /entrar when there is no session", () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false });

    renderProtected();

    expect(screen.getByText("Tela de entrar")).toBeInTheDocument();
  });

  it("redirects to /questionario when the health profile is incomplete", () => {
    useAuthMock.mockReturnValue({ session: {}, isLoading: false });
    useHealthProfileQueryMock.mockReturnValue({
      isPending: false,
      data: { is_completed: false },
    });

    renderProtected();

    expect(screen.getByText("Tela de questionário")).toBeInTheDocument();
  });

  it("renders the protected content once authenticated with a completed profile", () => {
    useAuthMock.mockReturnValue({ session: {}, isLoading: false });

    renderProtected();

    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });

  it("skips the profile check when requireCompletedProfile is false", () => {
    useAuthMock.mockReturnValue({ session: {}, isLoading: false });
    useHealthProfileQueryMock.mockReturnValue({ isPending: false, data: null });

    renderProtected(false);

    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });

  it("shows a recoverable error instead of redirecting on profile fetch failure", () => {
    useAuthMock.mockReturnValue({ session: {}, isLoading: false });
    useHealthProfileQueryMock.mockReturnValue({
      isPending: false,
      isError: true,
      refetch: vi.fn(),
      data: undefined,
    });

    renderProtected();

    expect(screen.getByText("Não foi possível validar seu perfil")).toBeInTheDocument();
    expect(screen.queryByText("Tela de questionário")).not.toBeInTheDocument();
  });
});
