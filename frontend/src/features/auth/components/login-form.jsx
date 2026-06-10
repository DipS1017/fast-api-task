import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginSchema, registerSchema } from "../schema";
import { useLoginMutation, useRegisterMutation } from "../mutations";

export function LoginForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const active = mode === "login" ? loginMutation : registerMutation;

  const form = useForm({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values) {
    active.mutate(values, { onSuccess: () => navigate("/") });
  }

  function toggleMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    form.reset();
    active.reset();
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@techkraft.io"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
        </Form>

        <Button variant="link" className="w-full" onClick={toggleMode}>
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
