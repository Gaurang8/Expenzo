import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { LogIn } from "lucide-react"

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
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import { ROUTES } from "@/lib/routes"
import { useForgotPassword } from "@/features/auth/mutations"
import { toast } from "@/lib/toast"

const forgotPasswordSchema = z
  .object({
    email: z.string().email("Please enter a valid email."),
  })

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const { mutate: forgotPassword, isPending } = useForgotPassword()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  function onSubmit(data: ForgotPasswordFormValues) {
    forgotPassword(data, {
      onSuccess: (res) => {
        toast.success(res.message)
      },
      onError: (err) => {
        toast.apiError(err)
      },
    })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md">
            <LogIn />
          </div>
          Expanzo
        </a>
        <Card className="w-full sm:max-w-md">
          <CardHeader className="text-center my-5">
            <CardTitle className="text-xl font-semibold" >Reset Password</CardTitle>
            <CardDescription className=" text-slate-600">
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="forgot-password-form" onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field data-invalid={form.formState.errors.email}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    {...form.register("email")}
                    id="email"
                    type="text"
                    placeholder="m@example.com"
                    autoComplete="email"
                  />
                  {form.formState.errors.email && <FieldError errors={[form.formState.errors.email]} />}
                </Field>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-10 bg-indigo-700"
                    size="lg"
                    disabled={isPending}
                  >
                    {isPending ? "Sending..." : "Send Reset Link"}
                  </Button>
                </div>

                <p className="text-muted-foreground px-6 pt-4 text-center text-sm">
                  Remember your password?{" "}
                  <Link
                    to={ROUTES.LOGIN}
                    className="text-indigo-700 hover:underline"
                  >
                    Back to login
                  </Link>
                </p>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
