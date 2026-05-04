import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { UserProfile, UserRole } from "../types/database";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
