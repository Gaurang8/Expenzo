import { useUserInvitations } from "./queries"
import { useAcceptInvitation, useRejectInvitation } from "./mutations"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Check, X, Bell } from "lucide-react"
import { toast } from "@/lib/toast"

export function UserInvitations() {
  const { data: invitationsRes, refetch } = useUserInvitations()
  const invitations = invitationsRes?.data || []

  const acceptMutation = useAcceptInvitation()
  const rejectMutation = useRejectInvitation()

  const handleAccept = (id: number) => {
    acceptMutation.mutate(id, {
      onSuccess: (res) => {
        toast.success(res.message)
        refetch()
      },
      onError: (err) => {
        toast.apiError(err)
      },
    })
  }

  const handleReject = (id: number) => {
    rejectMutation.mutate(id, {
      onSuccess: (res) => {
        toast.success(res.message)
        refetch()
      },
      onError: (err) => {
        toast.apiError(err)
      },
    })
  }

  if (invitations.length === 0) return null

  return (
    <div className="px-6 mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Bell className="size-4 text-indigo-500" />
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Invitations ({invitations.length})
        </h3>
      </div>
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                  {invitation.group_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">You're invited to</p>
                <p className="text-sm font-bold text-indigo-900 truncate">{invitation.group_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleAccept(invitation.id)}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
                className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
              >
                <Check className="mr-1.5 size-3.5" />
                Accept
              </Button>
              <Button
                variant="outline"
                onClick={() => handleReject(invitation.id)}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
                className="h-9 px-3 border-indigo-100 text-slate-500 hover:bg-indigo-100/50 rounded-xl"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
