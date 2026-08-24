import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
}

export interface SignUpResult {
  needsEmailConfirmation: boolean;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (returnTo?: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider");
  }
  return context;
}
