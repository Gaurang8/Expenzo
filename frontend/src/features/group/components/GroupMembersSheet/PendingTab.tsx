import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import type { User } from "@/store/auth-store"

interface PendingTabProps {
    invitations: { id: number; email: string; status: string }[]
    currentUser: User | null
    acceptMutation: { mutate: (id: number) => void }
    rejectMutation: { mutate: (id: number) => void }
}

export function PendingTab({
    invitations,
    currentUser,
    acceptMutation,
    rejectMutation
}: PendingTabProps) {
    return (
        <>
            <div className="flex items-center gap-3">
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Invitations</h3>
                {invitations.length > 0 && (
                    <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded-md">{invitations.length}</span>
                )}
            </div>

            {invitations.length === 0 ? (
                <div className="text-center py-16">
                    <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="size-8 text-slate-200" />
                    </div>
                    <p className="text-[15px] text-slate-400 font-bold">No pending requests</p>
                    <p className="text-[13px] text-slate-300 mt-1">New requests will appear here</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {invitations.map((invitation) => {
                        const isForCurrentUser = invitation.email === currentUser?.email

                        return (
                            <div key={invitation.id} className="flex items-center justify-between gap-4 group">
                                <div className="flex items-center gap-4 min-w-0">
                                    <Avatar className="size-10 shadow-sm shrink-0">
                                        <AvatarImage src={undefined} />
                                        <AvatarFallback>{invitation.email.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[15px] font-bold text-slate-900 truncate leading-none mb-1.5">{invitation.email}</span>
                                        <span className="text-[12px] font-bold text-slate-400">Requested to join</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {isForCurrentUser ? (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 px-4 text-[13px] font-bold text-rose-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-xl"
                                                onClick={() => rejectMutation.mutate(invitation.id)}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-9 px-5 text-[13px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 border-none transition-all active:scale-95"
                                                onClick={() => acceptMutation.mutate(invitation.id)}
                                            >
                                                Accept
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="bg-slate-50 text-slate-400 text-[12px] font-bold px-3 py-1.5 rounded-xl border border-slate-100">
                                            {invitation.status === 'pending' ? 'Waiting' : invitation.status}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </>
    )
}
