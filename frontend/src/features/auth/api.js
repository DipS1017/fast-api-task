import { apiFetch } from "@/lib/api-client";

// raw request functions - no React here, just the network calls.

export function login({ email, password }) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function register({ email, password }) {
  // role is deliberately not sent - the backend always creates a reviewer.
  return apiFetch("/auth/register", {
    method: "POST",
    body: { email, password },
  });
}
