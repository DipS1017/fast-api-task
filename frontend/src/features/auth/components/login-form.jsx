import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation, useRegisterMutation } from "../mutations";

export function LoginForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const active = mode === "login" ? loginMutation : registerMutation;

  function onSubmit(e) {
    e.preventDefault();
    active.mutate({ email, password }, { onSuccess: () => navigate("/") });
  }

  return (
    <Card className="mx-auto mt-16 w-full max-w-sm">
      <CardHeader className="flex-col items-start gap-1">
        <CardTitle className="text-xl">
          {mode === "login" ? "Sign in" : "Create reviewer account"}
        </CardTitle>
        <CardDescription>Internal candidate review dashboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@techkraft.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {active.isError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {active.error.message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={active.isPending}>
            {active.isPending && <Loader2 className="size-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Register"}
          </Button>
        </form>

        <Button
          variant="link"
          className="w-full"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "Need an account? Register as a reviewer"
            : "Already have an account? Sign in"}
        </Button>

        <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Demo accounts</p>
          <p>admin@techkraft.io / admin1234</p>
          <p>reviewer@techkraft.io / review1234</p>
        </div>
      </CardContent>
    </Card>
  );
}
