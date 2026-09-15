import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./authContext";
import { registerBeforeSignOut } from "./sessionLifecycle";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  updateUser: vi.fn(),
}));
let emitAuthStateChange: (event: string, session: Session | null) => void;

vi.mock("@/lib/supabaseClient", () => ({
  setCurrentAccessToken: vi.fn(),
  supabaseClient: { auth },
}));

const LAST_ACTIVITY_STORAGE_KEY = "oralcardio.auth.lastActivity";
const HOUR_MS = 60 * 60 * 1_000;
const BASE_TIME = Date.UTC(2026, 8, 14, 12);
const MOCK_SESSION = {
  access_token: "token-123",
  user: { id: "user-1" },
} as Session;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function storeLastActivity(userId: string, at: number) {
  localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, JSON.stringify({ userId, at }));
}

async function flushBootstrap() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.onAuthStateChange.mockImplementation((callback) => {
      emitAuthStateChange = (event, session) => callback(event, session);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    auth.signInWithPassword.mockResolvedValue({ data: { session: MOCK_SESSION }, error: null });
    auth.signOut.mockImplementation(async () => {
      auth.getSession.mockResolvedValue({ data: { session: null } });
      return { error: null };
    });
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    auth.updateUser.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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

  it("keeps an active user signed in", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    storeLastActivity("user-1", BASE_TIME);
    auth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    renderHook(useAuth, { wrapper });
    await flushBootstrap();

    await vi.advanceTimersByTimeAsync(HOUR_MS - 1_000);
    window.dispatchEvent(new Event("pointermove"));
    await vi.advanceTimersByTimeAsync(HOUR_MS - 1_000);

    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("keeps a user authenticated for less than one hour of inactivity", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME + HOUR_MS - 1);
    storeLastActivity("user-1", BASE_TIME);
    auth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    const { result } = renderHook(useAuth, { wrapper });

    await flushBootstrap();

    expect(result.current.session).toBe(MOCK_SESSION);
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("signs out locally after one hour of inactivity and runs pre-sign-out cleanup", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    storeLastActivity("user-1", BASE_TIME);
    auth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    const cleanup = vi.fn();
    const unregister = registerBeforeSignOut(cleanup);
    renderHook(useAuth, { wrapper });
    await flushBootstrap();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(HOUR_MS);
    });

    expect(cleanup).toHaveBeenCalledOnce();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    unregister();
  });

  it("does not reset persisted inactivity when the provider reloads", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME + 30 * 60 * 1_000);
    storeLastActivity("user-1", BASE_TIME);
    auth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    const firstRender = renderHook(useAuth, { wrapper });
    await flushBootstrap();
    firstRender.unmount();

    vi.setSystemTime(BASE_TIME + HOUR_MS - 1);
    const secondRender = renderHook(useAuth, { wrapper });
    await flushBootstrap();

    expect(secondRender.result.current.session).toBe(MOCK_SESSION);
    expect(JSON.parse(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY) ?? "null")).toEqual({
      userId: "user-1",
      at: BASE_TIME,
    });
  });

  it("requires login when reopening the app after one hour", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME + HOUR_MS);
    storeLastActivity("user-1", BASE_TIME);
    auth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    const { result } = renderHook(useAuth, { wrapper });

    await flushBootstrap();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.session).toBeNull();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(auth.getSession).toHaveBeenCalledOnce();
  });

  it("preserves global manual logout and clears the activity record", async () => {
    storeLastActivity("user-1", BASE_TIME);
    auth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    const { result } = renderHook(useAuth, { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.signOut());

    expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY)).toBeNull();
  });

  it("signs in normally and replaces another user's activity record", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    storeLastActivity("old-user", BASE_TIME - HOUR_MS);
    const { result } = renderHook(useAuth, { wrapper });
    await flushBootstrap();

    await act(() => result.current.signIn("ana@example.com", "segredo"));

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "ana@example.com",
      password: "segredo",
    });
    expect(JSON.parse(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY) ?? "null")).toEqual({
      userId: "user-1",
      at: BASE_TIME,
    });
  });

  it("replaces persisted activity when the authenticated user changes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    storeLastActivity("user-1", BASE_TIME - 1_000);
    auth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    renderHook(useAuth, { wrapper });
    await flushBootstrap();
    const nextSession = {
      access_token: "token-456",
      user: { id: "user-2" },
    } as Session;

    act(() => emitAuthStateChange("SIGNED_IN", nextSession));

    expect(JSON.parse(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY) ?? "null")).toEqual({
      userId: "user-2",
      at: BASE_TIME,
    });
  });

  it("uses activity from another tab to postpone expiration", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    storeLastActivity("user-1", BASE_TIME);
    auth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    renderHook(useAuth, { wrapper });
    await flushBootstrap();

    await vi.advanceTimersByTimeAsync(50 * 60 * 1_000);
    const otherTabActivity = Date.now();
    storeLastActivity("user-1", otherTabActivity);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LAST_ACTIVITY_STORAGE_KEY,
        newValue: localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY),
        storageArea: localStorage,
      }),
    );
    await vi.advanceTimersByTimeAsync(20 * 60 * 1_000);

    expect(auth.signOut).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(40 * 60 * 1_000);
    });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("checks expiration before accepting new activity", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    storeLastActivity("user-1", BASE_TIME);
    auth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    renderHook(useAuth, { wrapper });
    await flushBootstrap();

    vi.setSystemTime(BASE_TIME + HOUR_MS);
    window.dispatchEvent(new Event("pointermove"));
    await act(async () => Promise.resolve());

    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("throttles persistence of pointer movement", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    storeLastActivity("user-1", BASE_TIME);
    auth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    renderHook(useAuth, { wrapper });
    await flushBootstrap();
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    for (let index = 0; index < 100; index += 1) {
      window.dispatchEvent(new Event("pointermove"));
    }
    expect(setItem).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(30_000);
    window.dispatchEvent(new Event("pointermove"));
    expect(setItem).toHaveBeenCalledOnce();
  });

  it("eventually shares the latest throttled activity with other tabs", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    storeLastActivity("user-1", BASE_TIME);
    auth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    renderHook(useAuth, { wrapper });
    await flushBootstrap();

    await vi.advanceTimersByTimeAsync(10_000);
    window.dispatchEvent(new Event("pointermove"));
    await vi.advanceTimersByTimeAsync(10_000);
    window.dispatchEvent(new Event("pointermove"));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(JSON.parse(localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY) ?? "null")).toEqual({
      userId: "user-1",
      at: BASE_TIME + 20_000,
    });
  });
});
