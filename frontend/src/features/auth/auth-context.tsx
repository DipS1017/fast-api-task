import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { setUnauthorizedHandler } from "@/lib/api-client";
import { ROLE, STORAGE_KEYS } from "@/lib/constants";
import type { TokenResponse } from "@/lib/types";

interface Session {
  token: string;
  role: string;
}

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (token: TokenResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): Session | null {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const role = localStorage.getItem(STORAGE_KEYS.ROLE);
  return token ? { token, role: role ?? "" } : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(readSession);

  const signIn = useCallback(
    ({ access_token, refresh_token, role }: TokenResponse) => {
      localStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
      localStorage.setItem(STORAGE_KEYS.REFRESH, refresh_token);
      localStorage.setItem(STORAGE_KEYS.ROLE, role);
      setSession({ token: access_token, role });
    },
    []
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    setSession(null);
    // drop any cached candidate data belonging to the previous user
    queryClient.clear();
  }, [queryClient]);

  // let the api client sign us out when a token is rejected (expiry/invalid)
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isAdmin: session?.role === ROLE.ADMIN,
      signIn,
      signOut,
    }),
    [session, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
