import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Wallet, ChevronRight, Users } from "lucide-react"
import { useParams } from "react-router-dom"
import { useGroups, useGroupMembers } from "./queries"
import { useState } from "react"
import { GroupMembersSheet } from "./GroupMembersSheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const GroupDetail = () => {
    const { groupId } = useParams()
    const { data: groupsRes } = useGroups()
    const { data: membersRes } = useGroupMembers(groupId)
    
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const groups = groupsRes?.data || []
    const group = groups.find(g => g.id.toString() === groupId)
    const members = membersRes?.data || []

    if (!group) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <p className="text-slate-500 text-lg font-medium animate-pulse">Loading group details...</p>
            </div>
        )
    }

    // Mock data for balances
    const balances = [
        { name: "Sahil", amount: 140, type: "owes_you" },
        { name: "Jatin Kantariya", amount: 250, type: "you_owe" },
        { name: "Marc Walter", amount: 14.35, type: "owes_you" },
    ]

    return (
        <div className="flex-1 flex flex-col h-screen bg-white overflow-hidden">
            {/* Topbar */}
            <div className="h-20 border-b flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-slate-800">{group.name}</h1>
                
                <div className="flex items-center gap-8">
                    <div className="hidden md:flex items-center gap-4">
                        {/* Avatar Group */}
                        <div className="flex -space-x-2.5">
                            {members.slice(0, 4).map((member) => (
                                <Avatar key={member.id} className="size-8 border-2 border-white ring-1 ring-slate-100 shadow-sm">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_email}`} />
                                    <AvatarFallback className="text-[10px] bg-slate-100">{member.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            ))}
                            {members.length > 4 && (
                                <div className="size-8 rounded-full bg-slate-100 border-2 border-white ring-1 ring-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                    +{members.length - 4}
                                </div>
                            )}
                        </div>

                        {/* Members Button */}
                        <Button 
                            variant="ghost" 
                            className="h-9 px-3 rounded-lg flex items-center gap-2 hover:bg-slate-50 text-slate-600 font-bold text-sm border border-slate-100"
                            onClick={() => setIsSheetOpen(true)}
                        >
                            <Users className="size-4" />
                            Members ({members.length})
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-lg h-12 px-4 cursor-pointer font-semibold border-slate-200 hover:bg-slate-50">
                            <Wallet className="mr-2 size-5 text-slate-600" />
                            Make payment
                        </Button>
                        <Button className="rounded-lg font-semibold h-12 px-4 cursor-pointer bg-indigo-700 hover:bg-indigo-600 shadow-lg shadow-indigo-100">
                            <Plus className="mr-2 size-5" />
                            Add expense
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {/* Balances Section */}
                <div className="mb-8">
                    <h2 className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">Balances</h2>
                    <div className="space-y-3">
                        {balances.map((balance, index) => (
                            <div key={index} className="flex items-center text-[15px]">
                                <span className="font-semibold text-slate-700">{balance.type === 'you_owe' ? 'You' : balance.name}</span>
                                <span className="mx-1.5 text-slate-500">{balance.type === 'you_owe' ? 'owe' : 'owes you'}</span>
                                <span className="font-semibold text-slate-700">
                                    {balance.type === 'you_owe' ? balance.name : 'you'}
                                </span>
                                <span className={`ml-2 font-bold ${balance.type === 'owes_you' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    ₹{balance.amount.toFixed(2)}
                                </span>
                            </div>
                        ))}
                        <button className="flex items-center text-slate-400 hover:text-indigo-600 transition-colors text-sm font-medium mt-4 group">
                            +5 more
                            <ChevronRight className="size-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>

                <Separator className="bg-slate-100 mb-8" />

                {/* Expenses Section Placeholder */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-800">January 2019</h2>
                    </div>

                    {/* Mock Grid Item from Image */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-rose-400 text-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-20">
                                <Wallet className="size-12 -rotate-12 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Plus className="size-4 rotate-45" />
                                </div>
                                <span className="font-medium">Electricity bill</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-xl font-bold">-₹12.95</div>
                                    <div className="text-[10px] opacity-80">Marc paid ₹25.90</div>
                                </div>
                                <div className="text-[10px] font-medium uppercase tracking-wider text-right">You owe</div>
                            </div>
                        </div>

                        <div className="bg-emerald-400 text-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-20">
                                <Wallet className="size-12 -rotate-12 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Plus className="size-4" />
                                </div>
                                <span className="font-medium">Dinner</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-xl font-bold">+₹13.00</div>
                                    <div className="text-[10px] opacity-80">You paid ₹26.00</div>
                                </div>
                                <div className="text-[10px] font-medium uppercase tracking-wider text-right">You are owed</div>
                            </div>
                        </div>

                        <div className="bg-slate-700 text-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-20">
                                <Wallet className="size-12 -rotate-12 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Plus className="size-4" />
                                </div>
                                <span className="font-medium">Marc paid you</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-xl font-bold">₹13.00</div>
                                </div>
                            </div>
                        </div>

                        {/* not involved card */}
                        <div className="bg-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-20">
                                <Wallet className="size-12 -rotate-12 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-slate-500/20 p-2 rounded-lg">
                                    <Plus className="size-4 text-slate-600" />
                                </div>
                                <span className="font-medium text-slate-600">Lunch at Cafe</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-xl font-bold text-slate-600">-</div>
                                    <div className="text-[10px] opacity-80">Jatin paid ₹260</div>
                                </div>
                                <div className="text-[10px] font-medium uppercase tracking-wider text-right opacity-80">
                                    Not concerned
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members Sheet */}
            <GroupMembersSheet 
                group={group} 
                open={isSheetOpen} 
                onOpenChange={setIsSheetOpen} 
            />
        </div>
    )
}

export default GroupDetail
