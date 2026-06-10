import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v6";

import App from "./App";
import { AuthProvider } from "@/features/auth/auth-context";
import { queryClient } from "@/lib/query-client";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NuqsAdapter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </NuqsAdapter>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
