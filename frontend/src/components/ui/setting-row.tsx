import { useState } from "react"
import type { ReactNode, ElementType } from "react"
import { Input } from "./input"
import { Check, X, ChevronRight } from "lucide-react"

export type SettingRowProps = {
    icon: ElementType
    label: string
    value?: ReactNode
    onClick?: (() => void) | null
    iconBg?: string
    iconColor?: string
    children?: ReactNode
}

export const SettingRow = ({ icon: Icon, label, value, onClick, iconBg = "bg-slate-50", iconColor = "text-slate-400", children }: SettingRowProps) => (
    <div
        className={`flex items-center justify-between min-h-[56px] py-2 ${onClick ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'} rounded-xl px-2 -mx-2 transition-all duration-200 group/row`}
        onClick={onClick || undefined}
    >
        <div className="flex items-center gap-4">
            <div className={`size-9 rounded-lg ${iconBg} flex items-center justify-center ${iconColor} ${onClick ? 'group-hover/row:brightness-95' : ''} transition-colors`}>
                <Icon className="size-5" />
            </div>
            <span className="text-[15px] font-bold text-slate-900">{label}</span>
        </div>
        <div className="flex items-center gap-3 overflow-hidden">
            {children || <span className="text-[14px] text-slate-500 font-medium group-hover/row:text-slate-900 transition-colors truncate max-w-[150px]">{value}</span>}
            {onClick && (
                <div className="size-7 rounded-full flex items-center justify-center group-hover/row:bg-slate-200/50 transition-all">
                    <ChevronRight className="size-4 text-slate-300 group-hover/row:text-indigo-600 group-hover/row:translate-x-0.5 transition-all" />
                </div>
            )}
        </div>
    </div>
)


export type EditableSettingRowProps = {
    icon: ElementType
    label: string
    value: string
    isEditing: boolean
    onEdit?: () => void
    onSave: (value: string) => void
    onCancel?: () => void
    isPending?: boolean
    placeholder?: string
    iconBg?: string
    iconColor?: string
}

export const EditableSettingRow = ({
    icon, label, value, isEditing, onEdit, onSave, onCancel, isPending, placeholder, iconBg, iconColor
}: EditableSettingRowProps) => {
    const [tempValue, setTempValue] = useState<string>(value)

    if (isEditing) {
        return (
            <div className="flex items-center min-h-[56px] py-1 w-full">
                <div className="flex-1 relative">
                    <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        placeholder={placeholder}
                        className="h-11 pl-3 pr-20 font-bold text-slate-900 focus-visible:ring-indigo-500 bg-white border-2 border-indigo-100 rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.08)]"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onSave(tempValue)
                            if (e.key === 'Escape' && onCancel) onCancel()
                        }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                            onClick={() => onSave(tempValue)}
                            disabled={isPending}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isPending ? (
                                <div className="size-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Check className="size-4 stroke-[3]" />
                            )}
                        </button>
                        <button
                            onClick={onCancel}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                            <X className="size-4 stroke-[3]" />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <SettingRow
            icon={icon}
            label={label}
            value={value}
            onClick={onEdit}
            iconBg={iconBg}
            iconColor={iconColor}
        />
    )
}
