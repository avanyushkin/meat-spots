import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSession, login, logout, restoreSession, supabase } from "../lib/supabase";
import { storageGet, storageRemove, storageSet } from "../lib/telegram";

const REFRESH_TOKEN_KEY = "sb_refresh_token";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const existing = await getSession();
      if (existing) {
        if (!cancelled) {
          setSession(existing);
          setStatus("authenticated");
        }
        return;
      }

      const refreshToken = await storageGet(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        const restored = await restoreSession(refreshToken);
        if (restored) {
          if (!cancelled) {
            setSession(restored);
            setStatus("authenticated");
          }
          if (restored.refresh_token) await storageSet(REFRESH_TOKEN_KEY, restored.refresh_token);
          return;
        }
      }

      if (!cancelled) setStatus("unauthenticated");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        setSession(newSession);
        setStatus("authenticated");
        if (newSession.refresh_token) void storageSet(REFRESH_TOKEN_KEY, newSession.refresh_token);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (password: string) => {
    setError(null);
    try {
      const newSession = await login(password);
      setSession(newSession);
      setStatus("authenticated");
      if (newSession.refresh_token) await storageSet(REFRESH_TOKEN_KEY, newSession.refresh_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    await storageRemove(REFRESH_TOKEN_KEY);
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  return { session, status, error, signIn, signOut };
}
