import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"

import { useRegister } from "@/features/signup/mutations"
import { toast } from "@/lib/toast"
import { ROUTES } from "@/lib/routes"

const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters.")
      .max(50, "Name must be at most 50 characters."),

    email: z.email("Please enter a valid email."),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters."),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupForm() {
  const navigate = useNavigate()
  const { mutate: register, isPending } = useRegister()

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  function onSubmit(data: SignupFormValues) {
    register(
      {
        full_name: data.name,
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: (res) => {
          toast.success(res.message)
          navigate(ROUTES.LOGIN)
        },
        onError: (err) => {
          toast.apiError(err)
        },
      },
    )
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader className="text-center my-5">
        <CardTitle className="text-xl font-semibold">Create an account</CardTitle>

        <CardDescription>
          Enter your information below to create your account.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="signup-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-name">
                    Full Name
                  </FieldLabel>

                  <Input
                    {...field}
                    id="signup-name"
                    placeholder="ex. Gaurang Patel"
                    autoComplete="name"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-email">
                    Email
                  </FieldLabel>

                  <Input
                    {...field}
                    id="signup-email"
                    type="text"
                    placeholder="m@example.com"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                  />

                  <FieldDescription>
                    We&apos;ll use this to contact you.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-password">
                    Password
                  </FieldLabel>

                  <Input
                    {...field}
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />

                  <FieldDescription>
                    Must be at least 8 characters long.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-confirm-password">
                    Confirm Password
                  </FieldLabel>

                  <Input
                    {...field}
                    id="signup-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />

                  <FieldDescription>
                    Please confirm your password.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full h-10 bg-indigo-700"
                size="lg"
                disabled={isPending}
              >
                {isPending ? "Creating account…" : "Create Account"}
              </Button>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card my-2">
                Or continue with
              </FieldSeparator>

              <Button
                variant="outline"
                type="button"
                className="w-full h-10"
              >
                Sign up with Google
              </Button>
            </div>

            <p className="text-muted-foreground px-6 text-center text-sm">
              Already have an account?{" "}
              <Link
                to={ROUTES.LOGIN}
                className="text-indigo-700 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}