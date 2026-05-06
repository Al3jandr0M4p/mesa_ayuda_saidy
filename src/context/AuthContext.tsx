import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigError } from "../services/supabaseClient";
import type { UserProfile } from "../types/database";
import { AuthContext, type AuthContextValue } from "./auth-context";

const getAuthErrorMessage = (message: string) => {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Credenciales incorrectas. Revisa tu email y contraseña.";
  }

  return message;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(supabaseConfigError);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error: profileError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      throw new Error("No se pudo cargar el perfil del usuario.");
    }

    if (!data) {
      throw new Error("La sesion existe, pero falta el perfil del usuario en la tabla usuarios.");
    }

    setProfile(data);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const currentUserId = data.session?.user.id;

    if (!currentUserId) {
      setProfile(null);
      return;
    }

    await fetchProfile(currentUserId);
  }, [fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setError(supabaseConfigError);

      if (!nextSession?.user.id) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        await fetchProfile(nextSession.user.id);
      } catch (profileError) {
        if (!isMounted) {
          return;
        }

        setProfile(null);
        setError(profileError instanceof Error ? profileError.message : "Error cargando perfil.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const loadSession = async () => {
      setIsLoading(true);

      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
        setIsLoading(false);
        return;
      }

      await applySession(data.session);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Avoid awaiting Supabase calls directly inside this callback.
      queueMicrotask(() => {
        void applySession(nextSession);
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      const message = getAuthErrorMessage(loginError.message);
      setError(message);
      return { ok: false, error: message };
    }

    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      role: profile?.rol ?? null,
      isLoading,
      error,
      signIn,
      signOut,
      refreshProfile,
    }),
    [error, isLoading, profile, refreshProfile, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
