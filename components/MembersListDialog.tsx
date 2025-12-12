'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { User, Mail, Calendar, GraduationCap, Building2 } from "lucide-react"
import { useState, useMemo } from "react"

interface Member {
    id: string
    username: string
    email: string
    department: string | null
    year: string | null
    createdAt: Date
}

interface MembersListDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    members: Member[]
    domainName?: string
}

export function MembersListDialog({ open, onOpenChange, members, domainName }: MembersListDialogProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredMembers = useMemo(() => {
        if (!searchQuery.trim()) return members

        const query = searchQuery.toLowerCase()
        return members.filter(member =>
            member.username.toLowerCase().includes(query) ||
            member.email.toLowerCase().includes(query) ||
            member.department?.toLowerCase().includes(query) ||
            member.year?.toLowerCase().includes(query)
        )
    }, [members, searchQuery])

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-neutral-graphite">
                        Active Members {domainName && `in ${domainName}`}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    {/* Search Input */}
                    <div className="relative">
                        <Input
                            placeholder="Search members by name, email, department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-4"
                        />
                    </div>

                    {/* Members Count */}
                    <div className="text-sm text-secondary-500">
                        Showing {filteredMembers.length} of {members.length} members
                    </div>

                    {/* Members List */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {filteredMembers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="h-16 w-16 rounded-full bg-secondary-100 flex items-center justify-center mb-4">
                                    <User className="h-8 w-8 text-secondary-400" />
                                </div>
                                <p className="text-secondary-500 font-medium">
                                    {searchQuery ? "No members found" : "No members yet"}
                                </p>
                                <p className="text-sm text-secondary-400 mt-1">
                                    {searchQuery ? "Try adjusting your search" : "Members will appear here once they join"}
                                </p>
                            </div>
                        ) : (
                            filteredMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="rounded-xl border border-secondary-100 p-4 hover:bg-secondary-50 transition-colors group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 flex-1">
                                            <div className="rounded-full bg-primary-100 p-2.5 group-hover:bg-primary-200 transition-colors">
                                                <User className="h-5 w-5 text-primary-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-neutral-graphite truncate">
                                                    {member.username}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-sm text-secondary-500 mt-1">
                                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <span className="truncate">{member.email}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                                    {member.department && (
                                                        <div className="flex items-center gap-1.5 text-xs text-secondary-600">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                            <span>{member.department}</span>
                                                        </div>
                                                    )}
                                                    {member.year && (
                                                        <div className="flex items-center gap-1.5 text-xs text-secondary-600">
                                                            <GraduationCap className="h-3.5 w-3.5" />
                                                            <span>Year {member.year}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 text-xs text-secondary-400">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>Joined {formatDate(member.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
