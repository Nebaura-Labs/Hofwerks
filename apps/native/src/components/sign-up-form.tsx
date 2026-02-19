import { EnvelopeSimple, GoogleLogo, Lock, User } from "@phosphor-icons/react"
import { useForm } from "@tanstack/react-form"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

type SignUpFormProps = Omit<React.ComponentProps<"form">, "onSubmit"> & {
  onSubmitCredentials: (values: {
    name: string
    email: string
    password: string
  }) => Promise<void>
}

export function SignUpForm({
  className,
  onSubmitCredentials,
  ...props
}: SignUpFormProps) {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmitCredentials({
          name: value.name,
          email: value.email,
          password: value.password,
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Sign up failed. Please try again.")
      }
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
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
          <h1 className="text-2xl font-bold">Create your account</h1>
        </div>

        <form.Field name="name">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <User className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value)
                  }}
                  placeholder="Jonah"
                  required
                  type="text"
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
                    field.handleChange(event.target.value)
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
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
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
              <Button disabled={!state.canSubmit || state.isSubmitting} type="submit">
                {state.isSubmitting ? "Creating account..." : "Create account"}
              </Button>
            </Field>
          )}
        </form.Subscribe>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button type="button" variant="outline">
            <GoogleLogo className="size-4" weight="regular" />
            Sign up with Google
          </Button>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link className="underline underline-offset-4" to="/login">
              Log in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
