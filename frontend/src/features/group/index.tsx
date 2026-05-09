import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useGroups } from "./queries"
import { CreateGroupDialog } from "./CreateGroupDialog"
import { format } from "date-fns"

const GroupIndex = () => {
    const { data: groupsRes, isLoading } = useGroups()
    const groups = groupsRes?.data || []

    return (
        <div className="flex h-screen">
            <div className="w-[22vw] h-screen border-r border-slate-200 bg-white">
                <div className="h-20 border-b flex items-center justify-center px-4 relative">
                    <Input
                        placeholder="Search group"
                        className="bg-slate-100 h-12 rounded-full border-none focus-visible:border-none focus-visible:ring-0 pl-10"
                    />
                    <Search className="absolute left-7 text-slate-600 size-5" />
                </div>
                <div className="w-full h-26 border-b flex items-center justify-center p-4">
                    <CreateGroupDialog />
                </div>
                <div className="overflow-y-auto h-[calc(100vh-160px)]">
                    {isLoading ? (
                        <div className="p-4 text-center text-slate-500">Loading groups...</div>
                    ) : groups.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">No groups found.</div>
                    ) : (
                        groups.map((group) => (
                            <div key={group.id} className="flex items-center justify-between border-b px-4 py-4 hover:bg-slate-50 cursor-pointer">
                                <div className="flex items-center">
                                    <Avatar>
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${group.name}&backgroundColor=f4511e`} />
                                        <AvatarFallback>{group.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-3">
                                        <div className="text-sm font-semibold">{group.name}</div>
                                        <div className="text-xs font-medium text-slate-500 mt-0.5">
                                            Last Updated: {format(new Date(group.created_at), "MMM d, yyyy")}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm font-medium flex flex-col items-end">
                                    <div className="text-base text-destructive">
                                        - 200
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 italic">
                                        you owe
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div className="flex-1 h-screen border-l border-slate-200 bg-slate-50 flex items-center justify-center">
                <div className="text-center text-slate-500">
                    <Search className="size-12 mx-auto mb-4 opacity-20" />
                    <p>Select a group to see details</p>
                </div>
            </div>
        </div>
    )
}

export default GroupIndex