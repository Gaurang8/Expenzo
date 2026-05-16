import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"

import { useRegister } from "@/features/signup/mutations"
import { useGoogleLogin, type LoginData } from "@/features/login/mutations"
import type { ApiSuccess } from "@/lib/types"
import { toast } from "@/lib/toast"
import { ROUTES } from "@/lib/routes"
import { useAuthStore } from "@/store/auth-store"

const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters.")
      .max(50, "Name must be at most 50 characters."),

    email: z.string().email("Please enter a valid email."),

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
  const { mutate: register, isPending: isRegisterPending } = useRegister()
  const { mutate: googleLogin, isPending: isGooglePending } = useGoogleLogin()
  const { setUser } = useAuthStore()

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

  const handleAuthSuccess = (res: ApiSuccess<LoginData>) => {
    // Store tokens in localStorage
    localStorage.setItem("access_token", res.data.access)
    localStorage.setItem("refresh_token", res.data.refresh)

    // Update Zustand store
    setUser(res.data.user)

    toast.success(res.message)
    navigate(ROUTES.HOME)
  }

  const isPending = isRegisterPending || isGooglePending

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

            <Field data-invalid={form.formState.errors.name}>
              <FieldLabel htmlFor="signup-name">Full Name</FieldLabel>
              <Input
                {...form.register("name")}
                id="signup-name"
                placeholder="ex. Gaurang Patel"
                autoComplete="name"
              />
              {form.formState.errors.name && <FieldError errors={[form.formState.errors.name]} />}
            </Field>

            <Field data-invalid={form.formState.errors.email}>
              <FieldLabel htmlFor="signup-email">Email</FieldLabel>
              <Input
                {...form.register("email")}
                id="signup-email"
                type="text"
                placeholder="m@example.com"
                autoComplete="email"
              />
              <FieldDescription>We&apos;ll use this to contact you.</FieldDescription>
              {form.formState.errors.email && <FieldError errors={[form.formState.errors.email]} />}
            </Field>

            <Field data-invalid={form.formState.errors.password}>
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <Input
                {...form.register("password")}
                id="signup-password"
                type="password"
                autoComplete="new-password"
              />
              <FieldDescription>Must be at least 8 characters long.</FieldDescription>
              {form.formState.errors.password && <FieldError errors={[form.formState.errors.password]} />}
            </Field>

            <Field data-invalid={form.formState.errors.confirmPassword}>
              <FieldLabel htmlFor="signup-confirm-password">Confirm Password</FieldLabel>
              <Input
                {...form.register("confirmPassword")}
                id="signup-confirm-password"
                type="password"
                autoComplete="new-password"
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
              {form.formState.errors.confirmPassword && <FieldError errors={[form.formState.errors.confirmPassword]} />}
            </Field>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full h-10 bg-indigo-700"
                size="lg"
                disabled={isPending}
              >
                {isRegisterPending ? "Creating account…" : "Create Account"}
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