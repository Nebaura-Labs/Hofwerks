import { EnvelopeSimple, GoogleLogo, Lock } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import { Button } from "./ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "./ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

export default function SignInForm() {
  const navigate = useNavigate({ from: "/login" });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });

        if (result?.error) {
          toast.error(result.error.message ?? result.error.statusText ?? "Sign in failed");
          return;
        }

        navigate({ to: "/dashboard" });
        toast.success("Sign in successful");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Sign in failed");
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
        </div>

        <form.Field name="email">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <EnvelopeSimple />
                </InputGroupAddon>
                <InputGroupInput
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                  }}
                  placeholder="m@example.com"
                  required
                  type="email"
                  value={field.state.value}
                />
              </InputGroup>
              {field.state.meta.errors.map((error) => (
                <p className="text-sm text-rose-400" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </Field>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <a className="ml-auto text-sm underline-offset-4 hover:underline" href="#">
                  Forgot your password?
                </a>
              </div>
              <InputGroup>
                <InputGroupAddon>
                  <Lock />
                </InputGroupAddon>
                <InputGroupInput
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                  }}
                  required
                  type="password"
                  value={field.state.value}
                />
              </InputGroup>
              {field.state.meta.errors.map((error) => (
                <p className="text-sm text-rose-400" key={error?.message}>
                  {error?.message}
                </p>
              ))}
            </Field>
          )}
        </form.Field>

        <form.Subscribe>
          {(state) => (
            <Field>
              <Button className="w-full" disabled={!state.canSubmit || state.isSubmitting} type="submit">
                {state.isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </Field>
          )}
        </form.Subscribe>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button className="w-full" type="button" variant="outline">
            <GoogleLogo className="size-4" weight="regular" />
            Login with Google
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link className="underline underline-offset-4" to="/signup">
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
