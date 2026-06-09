import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const AuthContext = createContext(null);

function readSession() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  return token ? { token, role } : null;
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(readSession);

  const signIn = useCallback(({ access_token, role }) => {
    localStorage.setItem("token", access_token);
    localStorage.setItem("role", role);
    setSession({ token: access_token, role });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setSession(null);
    // drop any cached candidate data belonging to the previous user
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isAdmin: session?.role === "admin",
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
