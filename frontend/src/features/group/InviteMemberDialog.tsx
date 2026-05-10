import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { useInviteMember } from "./mutations"
import { toast } from "@/lib/toast"
import { UserPlus } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
})

interface InviteMemberDialogProps {
  groupId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMemberDialog({ groupId, open, onOpenChange }: InviteMemberDialogProps) {
  const { mutate: inviteMember, isPending } = useInviteMember(groupId)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    inviteMember(values, {
      onSuccess: (res) => {
        toast.success(res.message)
        onOpenChange(false)
        form.reset()
      },
      onError: (err) => {
        toast.apiError(err)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <UserPlus className="size-5 text-indigo-600" />
            Invite Member
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Send an invitation to join this group. They will receive an email to accept.
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-3" />
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">Email Address</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="friend@example.com"
                    {...field}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 bg-indigo-700 hover:bg-indigo-600 mt-2"
            >
              {isPending ? "Sending Invitation..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
