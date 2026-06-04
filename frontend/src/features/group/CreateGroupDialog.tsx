import { useState } from "react"
import { useForm } from "react-hook-form"
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
import { Plus, Upload, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const formSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters."),
  description: z.string().optional(),
  avatar: z.string().optional(),
})

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false)
  const { mutate: createGroup, isPending } = useCreateGroup()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      avatar: "",
    },
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData()
    formData.append("name", values.name)
    if (values.description) formData.append("description", values.description)
    if (avatarFile) formData.append("avatar", avatarFile)

    createGroup(formData, {
      onSuccess: (res) => {
        toast.success(res.message)
        setOpen(false)
        form.reset()
        setAvatarFile(null)
        setAvatarPreview(null)
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
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Group</DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Create a group to start splitting expenses with friends or family.
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-3" />
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar className="h-24 w-24 rounded-2xl border">
                <AvatarImage src={avatarPreview || undefined} className="object-cover" />
                <AvatarFallback className="rounded-2xl bg-slate-100 text-slate-400">
                  <Upload className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isPending}
              />
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null)
                    setAvatarPreview(null)
                  }}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <FieldGroup>
            <Field data-invalid={form.formState.errors.name}>
              <FieldLabel htmlFor="group-name">Group Name</FieldLabel>
              <Input
                id="group-name"
                placeholder="ex. Goa Trip, Office Lunch"
                {...form.register("name")}
              />
              {form.formState.errors.name && <FieldError errors={[form.formState.errors.name]} />}
            </Field>
            <Field data-invalid={form.formState.errors.description}>
              <FieldLabel htmlFor="group-desc">Description (Optional)</FieldLabel>
              <Textarea
                id="group-desc"
                placeholder="What is this group for?"
                className="resize-none h-24"
                {...form.register("description")}
              />
              {form.formState.errors.description && <FieldError errors={[form.formState.errors.description]} />}
            </Field>
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

