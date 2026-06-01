import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { LogIn } from "lucide-react"
import { useParams, useNavigate } from "react-router-dom"

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
import { ROUTES } from "@/lib/routes"
import { useResetPassword } from "@/features/auth/mutations"
import { toast } from "@/lib/toast"

const resetPasswordSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters."),
    confirm_password: z.string().min(8, "Password must be at least 8 characters."),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>()
  const navigate = useNavigate()
  const { mutate: resetPassword, isPending } = useResetPassword()

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  })

  function onSubmit(data: ResetPasswordFormValues) {
    if (!uid || !token) {
      toast.error("Invalid password reset link")
      return
    }

    resetPassword(
      { uidb64: uid, token, new_password: data.new_password },
      {
        onSuccess: (res) => {
          toast.success(res.message)
          navigate(ROUTES.LOGIN)
        },
        onError: (err) => {
          toast.apiError(err)
        },
      }
    )
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
            <CardTitle className="text-xl font-semibold" >Set New Password</CardTitle>
            <CardDescription className=" text-slate-600">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="reset-password-form" onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field data-invalid={form.formState.errors.new_password}>
                  <FieldLabel htmlFor="new_password">New Password</FieldLabel>
                  <Input
                    {...form.register("new_password")}
                    id="new_password"
                    type="password"
                    autoComplete="new-password"
                  />
                  {form.formState.errors.new_password && <FieldError errors={[form.formState.errors.new_password]} />}
                </Field>

                <Field data-invalid={form.formState.errors.confirm_password}>
                  <FieldLabel htmlFor="confirm_password">Confirm Password</FieldLabel>
                  <Input
                    {...form.register("confirm_password")}
                    id="confirm_password"
                    type="password"
                    autoComplete="new-password"
                  />
                  {form.formState.errors.confirm_password && <FieldError errors={[form.formState.errors.confirm_password]} />}
                </Field>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-10 bg-indigo-700"
                    size="lg"
                    disabled={isPending}
                  >
                    {isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
