import type { Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { setCurrentAccessToken, supabaseClient } from "@/lib/supabaseClient";
import {
  configureSessionSignOut,
  requestSessionSignOut,
  runBeforeSignOutHandlers,
} from "./sessionLifecycle";
import { AuthContext, type AuthContextValue, type SignUpParams, type SignUpResult } from "./authContext";

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1_000;
const ACTIVITY_PERSIST_THROTTLE_MS = 30_000;
const LAST_ACTIVITY_STORAGE_KEY = "oralcardio.auth.lastActivity";

interface PersistedActivity {
  userId: string;
  at: number;
}

function readLastActivity(userId: string): number | null {
  try {
    const value = localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY);
    if (!value) return null;
    const activity = JSON.parse(value) as Partial<PersistedActivity>;
    if (
      activity.userId !== userId ||
      typeof activity.at !== "number" ||
      !Number.isFinite(activity.at) ||
      activity.at < 0 ||
      activity.at > Date.now()
    ) {
      return null;
    }
    return activity.at;
  } catch {
    return null;
  }
}

function writeLastActivity(userId: string, at = Date.now()): void {
  try {
    localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, JSON.stringify({ userId, at }));
  } catch {
    // O timer em memória continua protegendo a sessão quando o storage falha.
  }
}

function clearLastActivity(): void {
  try {
    localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
  } catch {
    // O logout do Supabase continua sendo autoritativo para esta aba.
  }
}

function isInactive(lastActivityAt: number, now = Date.now()): boolean {
  return now - lastActivityAt >= INACTIVITY_TIMEOUT_MS;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isActive = true;
    function synchronizeSession(nextSession: Session | null) {
      const nextUserId = nextSession?.user.id ?? null;
      if (activeUserIdRef.current !== nextUserId) {
        queryClient.clear();
        activeUserIdRef.current = nextUserId;
      }
      if (!isActive) return;
      setCurrentAccessToken(nextSession?.access_token ?? null);
      setSession(nextSession);
    }

    async function bootstrapSession() {
      try {
        const { data } = await supabaseClient.auth.getSession();
        const restoredSession = data.session;
        if (restoredSession) {
          const userId = restoredSession.user.id;
          const lastActivityAt = readLastActivity(userId);
          if (lastActivityAt !== null && isInactive(lastActivityAt)) {
            await requestSessionSignOut("local");
            synchronizeSession(null);
            if (isActive) {
              navigateRef.current("/entrar", {
                replace: true,
                state: { sessionExpired: true },
              });
            }
            return;
          }
          if (lastActivityAt === null) writeLastActivity(userId);
        } else {
          clearLastActivity();
        }
        synchronizeSession(restoredSession);
      } catch {
        synchronizeSession(null);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    configureSessionSignOut(async (scope) => {
      await runBeforeSignOutHandlers();
      await supabaseClient.auth.signOut({ scope });
      clearLastActivity();
    });

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, newSession) => {
      const nextUserId = newSession?.user.id ?? null;
      if (event === "SIGNED_OUT") {
        clearLastActivity();
      } else if (
        event === "SIGNED_IN" &&
        nextUserId &&
        activeUserIdRef.current !== nextUserId
      ) {
        writeLastActivity(nextUserId);
      }
      synchronizeSession(newSession);
    });

    return () => {
      isActive = false;
      configureSessionSignOut(null);
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const authenticatedUserId = session?.user.id ?? null;

  useEffect(() => {
    if (!authenticatedUserId) return undefined;
    const userId = authenticatedUserId;

    let lastActivityAt = readLastActivity(userId) ?? Date.now();
    let lastPersistedAt = lastActivityAt;
    let timeoutId: number | undefined;
    let persistenceTimeoutId: number | undefined;
    let isSigningOut = false;

    function synchronizeFromStorage() {
      const storedActivityAt = readLastActivity(userId);
      if (storedActivityAt !== null && storedActivityAt > lastActivityAt) {
        lastActivityAt = storedActivityAt;
        lastPersistedAt = storedActivityAt;
        if (persistenceTimeoutId !== undefined) {
          window.clearTimeout(persistenceTimeoutId);
          persistenceTimeoutId = undefined;
        }
      }
    }

    function expireSession() {
      if (isSigningOut) return;
      isSigningOut = true;
      void requestSessionSignOut("local")
        .then(() => {
          navigateRef.current("/entrar", {
            replace: true,
            state: { sessionExpired: true },
          });
        })
        .catch(() => {
          isSigningOut = false;
          scheduleExpirationCheck();
        });
    }

    function checkExpiration(now = Date.now()): boolean {
      synchronizeFromStorage();
      if (!isInactive(lastActivityAt, now)) return false;
      expireSession();
      return true;
    }

    function scheduleExpirationCheck() {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      const remainingMs = Math.max(0, INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivityAt));
      timeoutId = window.setTimeout(() => {
        if (!checkExpiration()) scheduleExpirationCheck();
      }, remainingMs);
    }

    function registerActivity() {
      const now = Date.now();
      if (checkExpiration(now)) return;

      lastActivityAt = now;
      if (now - lastPersistedAt >= ACTIVITY_PERSIST_THROTTLE_MS) {
        persistLatestActivity();
      } else if (persistenceTimeoutId === undefined) {
        persistenceTimeoutId = window.setTimeout(() => {
          persistenceTimeoutId = undefined;
          persistLatestActivity();
        }, ACTIVITY_PERSIST_THROTTLE_MS - (now - lastPersistedAt));
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== LAST_ACTIVITY_STORAGE_KEY) return;
      synchronizeFromStorage();
      if (!checkExpiration()) scheduleExpirationCheck();
    }

    function checkVisibleSession() {
      if (document.visibilityState === "visible") checkExpiration();
    }

    function checkFocusedSession() {
      checkExpiration();
    }

    function persistLatestActivity() {
      if (isSigningOut || lastActivityAt <= lastPersistedAt) return;
      writeLastActivity(userId, lastActivityAt);
      lastPersistedAt = lastActivityAt;
      scheduleExpirationCheck();
    }

    const activityEvents = ["pointerdown", "pointermove", "keydown", "touchstart"] as const;
    for (const eventName of activityEvents) {
      window.addEventListener(eventName, registerActivity, { passive: true });
    }
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", checkFocusedSession);
    window.addEventListener("pagehide", persistLatestActivity);
    document.addEventListener("visibilitychange", checkVisibleSession);
    scheduleExpirationCheck();

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (persistenceTimeoutId !== undefined) window.clearTimeout(persistenceTimeoutId);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, registerActivity);
      }
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", checkFocusedSession);
      window.removeEventListener("pagehide", persistLatestActivity);
      document.removeEventListener("visibilitychange", checkVisibleSession);
    };
  }, [authenticatedUserId]);

  async function signIn(email: string, password: string): Promise<void> {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) writeLastActivity(data.session.user.id);
  }

  async function signUp({ email, password, fullName }: SignUpParams): Promise<SignUpResult> {
    // full_name precisa ir em options.data: o trigger handle_new_user() do
    // banco lê raw_user_meta_data->>'full_name' para criar public.users:
    // sem isso, a saudação do dashboard nasce vazia.
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    if (data.session) writeLastActivity(data.session.user.id);

    return { needsEmailConfirmation: data.session === null };
  }

  async function requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) throw error;
  }

  async function updatePassword(password: string): Promise<void> {
    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) throw error;
  }

  async function signOut(): Promise<void> {
    await requestSessionSignOut();
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isLoading,
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
