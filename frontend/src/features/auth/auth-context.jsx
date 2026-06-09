import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ROLE, STORAGE_KEYS } from "@/lib/constants";

const AuthContext = createContext(null);

function readSession() {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const role = localStorage.getItem(STORAGE_KEYS.ROLE);
  return token ? { token, role } : null;
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(readSession);

  const signIn = useCallback(({ access_token, role }) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
    setSession({ token: access_token, role });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    setSession(null);
    // drop any cached candidate data belonging to the previous user
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
