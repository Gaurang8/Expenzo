import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
    isLoading?: boolean
}

export const ConfirmDialog = ({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    isLoading = false,
}: ConfirmDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] rounded-[32px]! p-8 border-none shadow-2xl">
                <DialogHeader className="flex flex-col items-center text-center gap-4">
                    <div className={`size-16 rounded-full flex items-center justify-center ${variant === 'destructive' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-600'}`}>
                        <AlertCircle className="size-8" />
                    </div>
                    <div className="space-y-2">
                        <DialogTitle className="text-2xl font-black text-slate-900">{title}</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-[15px] leading-relaxed px-4">
                            {description}
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <DialogFooter className="flex flex-row gap-3 mt-8 sm:justify-center">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-[52px] rounded-2xl font-bold text-slate-500 hover:bg-slate-50 border-none"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className={`flex-1 h-[52px] rounded-2xl font-bold text-[15px] text-white shadow-lg transition-all active:scale-[0.98] ${
                            variant === 'destructive' 
                                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-100' 
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                        }`}
                    >
                        {isLoading ? "Processing..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
