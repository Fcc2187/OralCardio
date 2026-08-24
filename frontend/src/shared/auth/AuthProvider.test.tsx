import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./authContext";

const auth = vi.hoisted(() => ({
  getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabaseClient", () => ({
  supabaseClient: { auth },
  setCurrentAccessToken: vi.fn(),
}));

function GoogleSignInTrigger() {
  const { signInWithGoogle } = useAuth();
  const [failed, setFailed] = useState(false);

  return (
    <>
      <button onClick={() => void signInWithGoogle("/agenda").catch(() => setFailed(true))}>
        Continuar com Google
      </button>
      {failed ? <p>Falha no OAuth</p> : null}
    </>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    sessionStorage.clear();
    auth.signInWithOAuth.mockReset().mockResolvedValue({ error: null });
  });

  it("starts Google OAuth with the application callback", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <GoogleSignInTrigger />
        </AuthProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continuar com Google" }));

    await waitFor(() => {
      expect(auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    });
  });

  it("clears the saved path when starting OAuth throws", async () => {
    auth.signInWithOAuth.mockRejectedValueOnce(new Error("network failure"));

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <GoogleSignInTrigger />
        </AuthProvider>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continuar com Google" }));

    expect(await screen.findByText("Falha no OAuth")).toBeInTheDocument();
    expect(sessionStorage).toHaveLength(0);
  });
});
