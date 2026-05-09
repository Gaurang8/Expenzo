import React, { useState } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { useCreateGroup } from "./mutations"
import { toast } from "@/lib/toast"
import { Plus } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters."),
  description: z.string().optional(),
})

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false)
  const { mutate: createGroup, isPending } = useCreateGroup()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    createGroup(values, {
      onSuccess: (res) => {
        toast.success(res.message)
        setOpen(false)
        form.reset()
      },
      onError: (err) => {
        toast.apiError(err)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-14 bg-indigo-700 hover:bg-indigo-600 cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Group</DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Create a group to start splitting expenses with friends or family.
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-3" />
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="group-name">Group Name</FieldLabel>
                  <Input
                    id="group-name"
                    placeholder="ex. Goa Trip, Office Lunch"
                    {...field}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="group-desc">Description (Optional)</FieldLabel>
                  <Textarea
                    id="group-desc"
                    placeholder="What is this group for?"
                    className="resize-none h-24"
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
              {isPending ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

