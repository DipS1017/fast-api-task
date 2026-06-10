import { useMutation } from "@tanstack/react-query";

import { useAuth } from "./auth-context";
import * as authApi from "./api";

// On success both mutations hand the token+role to the auth context so the
// session is persisted and the app re-renders as logged in.

export function useLoginMutation() {
  const { signIn } = useAuth();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: signIn,
  });
}

export function useRegisterMutation() {
  const { signIn } = useAuth();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: signIn,
  });
}
