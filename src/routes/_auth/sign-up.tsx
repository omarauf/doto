import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useId } from "react";
import { z } from "zod";
import { useAppForm } from "@/components/form";
import { toast } from "@/components/ui/toast";
import { authClient } from "@/core/auth/auth-client";
import { getError } from "@/lib/error";
import { getSession } from "@/modules/workspace/workspace.functions";

export const Route = createFileRoute("/_auth/sign-up")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session) throw redirect({ to: "/" });
  },
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate({ from: "/sign-up" });

  const formId = useId();
  const form = useAppForm({
    formId,
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onSubmit: z.object({
        name: z
          .string()
          .trim()
          .min(1, "Please enter your name.")
          .max(100, "Name must be less than 100 characters."),
        email: z.email("Please enter a valid email address.").trim(),
        password: z.string().min(8, "Password must be at least 8 characters long."),
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await authClient.signUp.email(value);

        if (result.error) {
          const msg = result.error.message ?? "We could not complete that request.";
          toast.add({ type: "error", description: msg, priority: "high" });
          return;
        }

        await navigate({ to: "/" });
        // toast.success("Folder created successfully");
      } catch (error) {
        const msg = getError(error, "An error occurred while creating the folder.");
        toast.add({ type: "error", description: msg, priority: "high" });
      }
    },
  });

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <form id={formId} className="mt-9 space-y-5" onSubmit={onSubmitHandler}>
        <form.AppField name="name">
          {(field) => <field.Input type="text" label="Name" placeholder="Your name" />}
        </form.AppField>

        <form.AppField name="email">
          {(field) => <field.Input type="email" label="Email" placeholder="Email address" />}
        </form.AppField>

        <form.AppField name="password">
          {(field) => <field.Input type="password" label="Password" placeholder="Password" />}
        </form.AppField>

        <form.AppForm>
          <form.SubmitButton>Sign up</form.SubmitButton>
        </form.AppForm>

        <p className="text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link to="/sign-in">
            <span className="font-medium text-primary underline underline-offset-4">Sign in</span>
          </Link>
        </p>
      </form>
    </main>
  );
}
