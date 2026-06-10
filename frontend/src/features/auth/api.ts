import { apiFetch } from "@/lib/api-client";
import type { TokenResponse } from "@/lib/types";

// raw request functions - no React here, just the network calls.

interface Credentials {
  email: string;
  password: string;
}

export function login({ email, password }: Credentials): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function register({
  email,
  password,
}: Credentials): Promise<TokenResponse> {
  // role is deliberately not sent - the backend always creates a reviewer.
  return apiFetch<TokenResponse>("/auth/register", {
    method: "POST",
    body: { email, password },
  });
}
