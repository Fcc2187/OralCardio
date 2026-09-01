import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./authContext";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("@/lib/supabaseClient", () => ({
  setCurrentAccessToken: vi.fn(),
  supabaseClient: { auth },
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

describe("AuthProvider password recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    auth.updateUser.mockResolvedValue({ error: null });
  });

  it("requests a reset link for the current application origin", async () => {
    const { result } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.requestPasswordReset("ana@example.com"));

    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("ana@example.com", {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
  });

  it("updates the authenticated user's password", async () => {
    const { result } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.updatePassword("MinhaSenha!2026"));

    expect(auth.updateUser).toHaveBeenCalledWith({ password: "MinhaSenha!2026" });
  });

  it("propagates a password recovery provider error", async () => {
    const providerError = new Error("Rate limit exceeded");
    auth.resetPasswordForEmail.mockResolvedValue({ error: providerError });
    const { result } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(() => result.current.requestPasswordReset("ana@example.com")),
    ).rejects.toBe(providerError);
  });
});
