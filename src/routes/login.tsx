import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Eye, EyeOff, Sparkles } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { getSession } from "@/features/workspace/workspace.functions";
import { authClient } from "@/lib/auth-client";

const loginSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => loginSearchSchema.parse(search),
  beforeLoad: async () => {
    const session = await getSession();
    if (session) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate({ from: "/login" });
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? "We could not complete that request.");
      setPending(false);
      return;
    }

    await navigate({ to: "/" });
  }

  return (
    <main className="auth-shell min-h-svh overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-stone-950/10 bg-[#f8f4ea] shadow-[0_30px_90px_rgba(57,45,29,0.14)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-[#19342f] p-12 text-[#f8f4ea] lg:flex lg:flex-col lg:justify-between">
          <div className="auth-grid absolute inset-0 opacity-20" />
          <div className="relative flex items-center gap-3 font-semibold text-sm uppercase tracking-[0.22em]">
            <span className="grid size-10 place-items-center rounded-full bg-[#f2a65a] text-[#19342f]">
              <Check className="size-5 stroke-[3]" />
            </span>
            Doto
          </div>

          <div className="relative max-w-xl pb-10">
            <Sparkles className="mb-8 size-7 text-[#f2a65a]" />
            <p className="mb-5 font-semibold text-[#9fc6bb] text-xs uppercase tracking-[0.28em]">
              Your quiet corner for getting things done
            </p>
            <h1 className="font-heading font-medium text-6xl leading-[0.96] tracking-[-0.045em] xl:text-7xl">
              Clear desk.
              <br />
              Clear mind.
            </h1>
            <p className="mt-7 max-w-md text-[#c7d8d2] text-lg leading-8">
              Keep every part of life in its place, then move through the day one satisfying check
              at a time.
            </p>
          </div>

          <p className="relative text-[#87a9a0] text-sm">
            Simple lists. Nothing between you and the work.
          </p>
        </section>

        <section className="relative flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="absolute top-8 left-8 flex items-center gap-2 font-bold text-sm uppercase tracking-[0.18em] lg:hidden">
            <span className="grid size-8 place-items-center rounded-full bg-[#19342f] text-[#f8f4ea]">
              <Check className="size-4 stroke-[3]" />
            </span>
            Doto
          </div>

          <div className="w-full max-w-md pt-10 lg:pt-0">
            <p className="mb-3 font-bold text-[#c96543] text-xs uppercase tracking-[0.2em]">
              {mode === "sign-in" ? "Welcome back" : "A fresh start"}
            </p>
            <h2 className="font-heading font-medium text-4xl text-[#1f2825] tracking-[-0.035em] sm:text-5xl">
              {mode === "sign-in" ? "Pick up where you left off." : "Make room for what matters."}
            </h2>
            <p className="mt-4 text-sm text-stone-600 leading-6">
              {mode === "sign-in"
                ? "Sign in to open your lists and keep moving."
                : "Create your account. We’ll have an Inbox waiting for you."}
            </p>

            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              {mode === "sign-up" && (
                <label className="block space-y-2">
                  <span className="font-semibold text-sm text-stone-700">Name</span>
                  <input
                    className="auth-input"
                    name="name"
                    autoComplete="name"
                    placeholder="How should we call you?"
                    minLength={1}
                    maxLength={100}
                    required
                  />
                </label>
              )}

              <label className="block space-y-2">
                <span className="font-semibold text-sm text-stone-700">Email</span>
                <input
                  className="auth-input"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="font-semibold text-sm text-stone-700">Password</span>
                <span className="relative block">
                  <input
                    className="auth-input pr-12"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                  <button
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-stone-400 transition-colors hover:text-stone-700"
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </span>
              </label>

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-red-700 text-sm">
                  {error}
                </p>
              )}

              <Button
                className="h-12 w-full rounded-xl bg-[#19342f] text-[#f8f4ea] text-base hover:bg-[#244a42]"
                type="submit"
                disabled={pending}
              >
                {pending
                  ? "One moment…"
                  : mode === "sign-in"
                    ? "Open my workspace"
                    : "Create my account"}
                {!pending && <ArrowRight className="ml-1 size-4" />}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-stone-600">
              {mode === "sign-in" ? "New around here?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="font-bold text-[#c96543] underline decoration-[#c96543]/30 underline-offset-4"
                onClick={() => {
                  setError(null);
                  setMode((value) => (value === "sign-in" ? "sign-up" : "sign-in"));
                }}
              >
                {mode === "sign-in" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
