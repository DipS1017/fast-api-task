import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/auth-context";

export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
