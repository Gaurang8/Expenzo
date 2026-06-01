import { useState, useRef } from "react"
import { useAuthStore } from "@/store/auth-store"
import { useUpdateSettings, useChangePassword } from "@/features/auth/mutations"
import { Calendar, Camera, Loader2, Save, Lock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/format"
import { toast } from "@/lib/toast"

export default function SettingsPage() {
    const user = useAuthStore(state => state.user)
    const updateSettingsMutation = useUpdateSettings()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [fullName, setFullName] = useState(user?.full_name || "")
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)

    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword()

    const [prevFullName, setPrevFullName] = useState(user?.full_name)

    // Update local state if the user object changes from outside (e.g. after a save)
    if (user?.full_name !== prevFullName) {
        setPrevFullName(user?.full_name)
        setFullName(user?.full_name || "")
    }

    if (!user) return null

    const handleDateFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateSettingsMutation.mutate({ date_format: e.target.value })
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error("Please upload a valid image file")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB")
            return
        }

        setAvatarFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleSaveProfile = () => {
        if (!fullName.trim()) {
            toast.error("Full name cannot be empty")
            return
        }

        const hasNameChanged = fullName.trim() !== user.full_name
        const hasAvatarChanged = avatarFile !== null

        if (!hasNameChanged && !hasAvatarChanged) return

        const formData = new FormData()
        if (hasNameChanged) formData.append("full_name", fullName.trim())
        if (hasAvatarChanged) formData.append("avatar", avatarFile)

        updateSettingsMutation.mutate(formData, {
            onSuccess: () => {
                setAvatarFile(null)
                // Preview will naturally match the new avatar URL
                if (fileInputRef.current) fileInputRef.current.value = ""
            }
        })
    }

    const hasUnsavedChanges = fullName.trim() !== user.full_name || avatarFile !== null

    const handleChangePassword = () => {
        if (!oldPassword || !newPassword) {
            toast.error("Please enter both old and new passwords")
            return
        }

        if (newPassword.length < 8) {
            toast.error("New password must be at least 8 characters")
            return
        }

        changePassword({ old_password: oldPassword, new_password: newPassword }, {
            onSuccess: (res) => {
                toast.success(res.message)
                setOldPassword("")
                setNewPassword("")
            },
            onError: (err) => {
                toast.apiError(err)
            }
        })
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-6 space-y-6 pt-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your account preferences and profile details.</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="text-sm font-semibold text-slate-900">Profile Details</h2>
                        {hasUnsavedChanges && (
                            <Button
                                size="sm"
                                onClick={handleSaveProfile}
                                disabled={updateSettingsMutation.isPending}
                                className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
                            >
                                {updateSettingsMutation.isPending ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Save className="size-4 mr-1.5" />}
                                Save changes
                            </Button>
                        )}
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <Avatar className="size-20 border border-slate-200 shadow-sm transition-all group-hover:brightness-90">
                                    <AvatarImage src={avatarPreview || user.avatar || undefined} className="object-cover" />
                                    <AvatarFallback className="text-2xl font-bold text-slate-400 bg-slate-50">
                                        {getInitials(user.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="size-6 text-white" />
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                    disabled={updateSettingsMutation.isPending}
                                />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">Profile picture</p>
                                <p className="text-xs text-slate-500 mt-1 mb-2">PNG, JPG or WEBP. Max 5MB.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={updateSettingsMutation.isPending}
                                >
                                    Change picture
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div>
                                <label className="text-sm font-medium text-slate-900 block mb-1.5">Full name</label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="max-w-md h-10 rounded-xl"
                                    placeholder="Enter your full name"
                                    disabled={updateSettingsMutation.isPending}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-900 block mb-1.5">Email address</label>
                                <Input
                                    value={user.email}
                                    disabled
                                    className="max-w-md h-10 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                                <p className="text-[11px] text-slate-500 mt-1.5">Email address cannot be changed.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-sm font-semibold text-slate-900">Preferences</h2>
                    </div>

                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Calendar className="size-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Date format</p>
                                    <p className="text-xs text-slate-500">How dates are displayed across the app</p>
                                </div>
                            </div>
                            <select
                                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                value={user.date_format || "MMM dd, yyyy"}
                                onChange={handleDateFormatChange}
                                disabled={updateSettingsMutation.isPending}
                            >
                                <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                                <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                                <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                                <option value="dd MMM yyyy">12 May 2025</option>
                                <option value="MMM dd, yyyy">May 12, 2025</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-sm font-semibold text-slate-900">Security</h2>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-slate-100 rounded-lg shrink-0 mt-1">
                                <Lock className="size-5 text-slate-600" />
                            </div>
                            <div className="space-y-4 w-full">
                                <div>
                                    <h3 className="text-sm font-medium text-slate-900">Change Password</h3>
                                    <p className="text-xs text-slate-500 mb-4">Update your password to keep your account secure</p>
                                </div>
                                
                                <div className="space-y-3 max-w-sm">
                                    <div>
                                        <Input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="h-10 rounded-xl"
                                            placeholder="Current password"
                                            disabled={isChangingPassword}
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="h-10 rounded-xl"
                                            placeholder="New password"
                                            disabled={isChangingPassword}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleChangePassword}
                                        disabled={isChangingPassword || !oldPassword || !newPassword}
                                        className="h-9 w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm"
                                    >
                                        {isChangingPassword ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                                        Update Password
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
