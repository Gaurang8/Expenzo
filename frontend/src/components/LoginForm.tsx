import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import { useNavigate } from "react-router-dom"
import { GoogleLogin } from "@react-oauth/google"

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

import { useLogin, useGoogleLogin, type LoginData } from "@/features/login/mutations"
import type { ApiSuccess } from "@/lib/types"
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
  const { mutate: login, isPending: isLoginPending } = useLogin()
  const { mutate: googleLogin, isPending: isGooglePending } = useGoogleLogin()
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
        handleAuthSuccess(res)
      },
      onError: (err) => {
        toast.apiError(err)
      },
    })
  }

  const handleAuthSuccess = (res: ApiSuccess<LoginData>) => {
    // Store tokens in localStorage
    localStorage.setItem("access_token", res.data.access)
    localStorage.setItem("refresh_token", res.data.refresh)

    // Update Zustand store
    setUser(res.data.user)

    toast.success(res.message)
    navigate(ROUTES.HOME)
  }

  const isPending = isLoginPending || isGooglePending

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
                {isLoginPending ? "Logging in..." : "Login"}
              </Button>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card my-2">
                Or continue with
              </FieldSeparator>

              <div className="w-full flex justify-center py-1">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      googleLogin({ token: credentialResponse.credential }, {
                        onSuccess: (res) => {
                          handleAuthSuccess(res)
                        },
                        onError: (err) => {
                          toast.apiError(err)
                        }
                      })
                    }
                  }}
                  onError={() => {
                    toast.error("Google login failed")
                  }}
                  theme="outline"
                  shape="rectangular"
                  width="640"
                  logo_alignment="center"
                />
              </div>

              {isGooglePending && (
                <p className="text-xs text-center text-slate-500 animate-pulse">
                  Connecting with Google...
                </p>
              )}
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