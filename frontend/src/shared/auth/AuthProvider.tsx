import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabaseClient } from "@/lib/supabaseClient";

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
}

interface SignUpResult {
  needsEmailConfirmation: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  async function signOut(): Promise<void> {
    await supabaseClient.auth.signOut();
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider");
  }
  return context;
}
