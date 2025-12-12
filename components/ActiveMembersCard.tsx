'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import { useState } from "react"
import { MembersListDialog } from "./MembersListDialog"

interface Member {
    id: string
    username: string
    email: string
    department: string | null
    year: string | null
    createdAt: Date
}

interface ActiveMembersCardProps {
    count: number
    members: Member[]
    domainName?: string
}

export function ActiveMembersCard({ count, members, domainName }: ActiveMembersCardProps) {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <>
            <Card
                className="cursor-pointer hover:shadow-lg hover:border-primary-200 transition-all group"
                onClick={() => setDialogOpen(true)}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-secondary-500 group-hover:text-primary-600 transition-colors">
                        Active Members
                    </CardTitle>
                    <Users className="h-4 w-4 text-primary-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-neutral-graphite group-hover:text-primary-600 transition-colors">
                        {count}
                    </div>
                    <p className="text-xs text-secondary-400 mt-1 group-hover:text-primary-500 transition-colors">
                        Click to view details
                    </p>
                </CardContent>
            </Card>

            <MembersListDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                members={members}
                domainName={domainName}
            />
        </>
    )
}
