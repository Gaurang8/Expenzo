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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"

import { useLogin } from "@/features/login/mutations"
import { toast } from "@/lib/toast"
import { useAuthStore } from "@/store/auth-store"
import { ROUTES } from "@/lib/routes"

const loginSchema = z
  .object({
    email: z.string().email("Please enter a valid email."),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters."),

  })

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const { mutate: login, isPending } = useLogin()
  const { setUser } = useAuthStore()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(data: LoginFormValues) {
    login(data, {
      onSuccess: (res) => {
        // Store tokens in localStorage
        localStorage.setItem("access_token", res.data.access)
        localStorage.setItem("refresh_token", res.data.refresh)

        // Update Zustand store
        setUser(res.data.user)

        toast.success(res.message)
        navigate(ROUTES.HOME)
      },
      onError: (err) => {
        toast.apiError(err)
      },
    })
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader className="text-center my-5">
        <CardTitle className="text-xl font-semibold" >Login to your account</CardTitle>

        <CardDescription className=" text-slate-600">
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="login-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-email">
                    Email
                  </FieldLabel>

                  <Input
                    {...field}
                    id="login-email"
                    type="text"
                    placeholder="m@example.com"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                  />
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
                  <div className="flex item-center">
                    <FieldLabel htmlFor="login-password">
                      Password
                    </FieldLabel>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>

                  <Input
                    {...field}
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                  />
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
                {isPending ? "Logging in..." : "Login"}
              </Button>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card my-2">
                Or continue with
              </FieldSeparator>

              <Button
                variant="outline"
                type="button"
                className="w-full h-10"
              >
                Login with Google
              </Button>
            </div>

            <p className="text-muted-foreground px-6 text-center text-sm">
              Don't have an account?{" "}
              <Link
                to={ROUTES.REGISTER}
                className="text-indigo-700  hover:underline"
              >
                Sign up
              </Link>
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}