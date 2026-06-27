import { useEffect, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

export type FieldType = "text" | "email" | "textarea" | "checkbox" | "number"

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  required?: boolean
}

interface AdminModalProps {
  open: boolean
  onClose: () => void
  title: string
  fields: FieldDef[]
  initialValues?: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  isLoading?: boolean
}

export function AdminModal({
  open,
  onClose,
  title,
  fields,
  initialValues = {},
  onSubmit,
  isLoading = false,
}: AdminModalProps) {
  
  // Memoize schema — fields is a stable module-level const in all callers
  const schema = useMemo(() => z.object(
    fields.reduce((acc, field) => {
      if (field.type === "checkbox") {
        acc[field.name] = z.boolean().optional()
      } else if (field.type === "email") {
        acc[field.name] = field.required 
          ? z.string().email("Invalid email format") 
          : z.string().email("Invalid email format").optional().or(z.literal(""))
      } else {
        acc[field.name] = field.required 
          ? z.string().min(1, `${field.label} is required`) 
          : z.string().optional()
      }
      return acc
    }, {} as Record<string, z.ZodTypeAny>)
  ), [fields])

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  })

  // Reset form when modal opens or closes
  useEffect(() => {
    if (open) {
      form.reset(initialValues)
    } else {
      // Reset to empty on close so next open starts fresh
      form.reset({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              {field.type !== "checkbox" && (
                <Label htmlFor={field.name}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
              )}
              
              <Controller
                control={form.control}
                name={field.name}
                render={({ field: formField, fieldState }) => (
                  <>
                    {field.type === "text" || field.type === "email" || field.type === "number" ? (
                      <Input
                        {...formField}
                        id={field.name}
                        type={field.type}
                        value={String(formField.value ?? "")}
                        className={fieldState.error ? "border-red-500" : ""}
                      />
                    ) : field.type === "textarea" ? (
                      <Textarea
                        {...formField}
                        id={field.name}
                        value={String(formField.value ?? "")}
                        className={fieldState.error ? "border-red-500" : ""}
                      />
                    ) : field.type === "checkbox" ? (
                      <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <Checkbox
                          id={field.name}
                          checked={Boolean(formField.value)}
                          onCheckedChange={formField.onChange}
                        />
                        <div className="space-y-1 leading-none">
                          <Label htmlFor={field.name} className="cursor-pointer">
                            {field.label}
                          </Label>
                        </div>
                      </div>
                    ) : null}
                    
                    {fieldState.error && (
                      <p className="text-sm text-red-500">{fieldState.error.message}</p>
                    )}
                  </>
                )}
              />
            </div>
          ))}
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
