import type { Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { setCurrentAccessToken, supabaseClient } from "@/lib/supabaseClient";
import {
  configureSessionSignOut,
  requestSessionSignOut,
  runBeforeSignOutHandlers,
} from "./sessionLifecycle";
import { AuthContext, type AuthContextValue, type SignUpParams, type SignUpResult } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
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
        synchronizeSession(data.session);
      } catch {
        synchronizeSession(null);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, newSession) => {
      synchronizeSession(newSession);
    });

    configureSessionSignOut(async () => {
      await runBeforeSignOutHandlers();
      await supabaseClient.auth.signOut();
    });

    return () => {
      isActive = false;
      configureSessionSignOut(null);
      subscription.unsubscribe();
    };
  }, [queryClient]);

  async function signIn(email: string, password: string): Promise<void> {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
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
