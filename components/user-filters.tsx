"use client"

import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"

export function UserFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentFilter = searchParams.get("role") || "ALL"

    function setFilter(role: string) {
        const params = new URLSearchParams(searchParams)
        if (role === "ALL") {
            params.delete("role")
        } else {
            params.set("role", role)
        }
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex space-x-2">
            <Button
                variant={currentFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("ALL")}
            >
                All
            </Button>
            <Button
                variant={currentFilter === "MEMBER" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("MEMBER")}
            >
                Members
            </Button>
            <Button
                variant={currentFilter === "LEAD" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("LEAD")}
            >
                Leads
            </Button>
            <Button
                variant={currentFilter === "ADMIN" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("ADMIN")}
            >
                Admins
            </Button>
        </div>
    )
}
