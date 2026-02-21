import { Eye, EyeSlash, EnvelopeSimple, GoogleLogo, Lock } from "@phosphor-icons/react"
import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

type LoginFormProps = Omit<React.ComponentProps<"form">, "onSubmit"> & {
  onSubmitCredentials: (values: { email: string; password: string }) => Promise<void>
  onSwitchToSignUp?: () => void
}

export function LoginForm({
  className,
  onSubmitCredentials,
  onSwitchToSignUp,
  ...props
}: LoginFormProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const normalizeEmail = (value: string): string =>
    value.trim().toLowerCase().replaceAll(" ", "")

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmitCredentials({
          email: normalizeEmail(value.email),
          password: value.password,
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Login failed. Please try again.")
      }
    },
    validators: {
      onSubmit: z.object({
        email: z
          .string()
          .min(1, "Email is required")
          .email("Please enter a valid email address"),
        password: z.string().trim().min(1, "Password is required"),
      }),
    },
  })

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
      noValidate
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login To Hofwerks</h1>
        </div>

        <form.Field name="email">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <EnvelopeSimple className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(normalizeEmail(event.target.value))
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
                <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
                  Forgot your password?
                </a>
              </div>
                <InputGroup>
                  <InputGroupAddon>
                    <Lock className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value)
                    }}
                    required
                    type={isPasswordVisible ? "text" : "password"}
                    value={field.state.value}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                      onClick={() => {
                        setIsPasswordVisible((previous) => !previous)
                      }}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      {isPasswordVisible ? (
                        <EyeSlash className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
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
              <Button disabled={!state.canSubmit || state.isSubmitting} type="submit">
                {state.isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </Field>
          )}
        </form.Subscribe>

        <div className="-my-1 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-muted-foreground text-xs">Or continue with</span>
          <div className="h-px flex-1 bg-white/20" />
        </div>
        <Field>
          <Button variant="outline" type="button">
            <GoogleLogo className="size-4" weight="regular" />
            Login with Google
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <button
              className="underline underline-offset-4"
              onClick={() => {
                onSwitchToSignUp?.()
              }}
              type="button"
            >
              Sign up
            </button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
