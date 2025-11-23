"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Edit, Trash2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

interface Domain {
    id: string
    name: string
    description: string | null
    maxCapacity: number
    leads: {
        userId: string
        user: {
            username: string
            email: string
        }
    }[]
}

interface Lead {
    id: string
    username: string
    email: string
}

export function EditDomainDialog({ domain, availableLeads, onUpdate }: { domain: Domain, availableLeads: Lead[], onUpdate: () => void }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [description, setDescription] = useState(domain.description || "")
    const [maxCapacity, setMaxCapacity] = useState(domain.maxCapacity.toString())
    const [selectedLeadId, setSelectedLeadId] = useState("")

    async function onUpdateDetails() {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/domains/${domain.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description,
                    maxCapacity: parseInt(maxCapacity),
                }),
            })

            if (!res.ok) throw new Error("Failed to update domain")

            router.refresh()
            onUpdate()
            // Don't close dialog, maybe show success toast?
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    async function onAddLead() {
        if (!selectedLeadId) return
        setIsLoading(true)
        try {
            const res = await fetch(`/api/domains/${domain.id}/leads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedLeadId }),
            })

            if (!res.ok) {
                const text = await res.text()
                throw new Error(text || "Failed to add lead")
            }

            setSelectedLeadId("")
            router.refresh()
            onUpdate()
        } catch (error: any) {
            console.error(error)
            alert(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    async function onRemoveLead(userId: string) {
        if (!confirm("Are you sure you want to remove this lead?")) return
        setIsLoading(true)
        try {
            const res = await fetch(`/api/domains/${domain.id}/leads?userId=${userId}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const text = await res.text()
                throw new Error(text || "Failed to remove lead")
            }

            router.refresh()
            onUpdate()
        } catch (error: any) {
            console.error(error)
            alert(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Domain: {domain.name}</DialogTitle>
                    <DialogDescription>
                        Manage domain details and assigned leads.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Domain Details Section */}
                    <div className="space-y-4 border-b pb-6">
                        <h3 className="text-lg font-medium">Details</h3>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-sm font-medium text-right">Description</label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-sm font-medium text-right">Max Capacity</label>
                            <Input
                                type="number"
                                value={maxCapacity}
                                onChange={(e) => setMaxCapacity(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={onUpdateDetails} disabled={isLoading} size="sm">
                                Save Details
                            </Button>
                        </div>
                    </div>

                    {/* Leads Management Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Assigned Leads</h3>

                        <div className="flex gap-2">
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={selectedLeadId}
                                onChange={(e) => setSelectedLeadId(e.target.value)}
                            >
                                <option value="">Select a Lead to Add</option>
                                {availableLeads.map(lead => (
                                    <option key={lead.id} value={lead.id}>
                                        {lead.username} ({lead.email})
                                    </option>
                                ))}
                            </select>
                            <Button onClick={onAddLead} disabled={!selectedLeadId || isLoading}>
                                <UserPlus className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {domain.leads.map((lead) => (
                                <div key={lead.userId} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{lead.user.username}</span>
                                        <span className="text-xs text-secondary-500">{lead.user.email}</span>
                                    </div>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => onRemoveLead(lead.userId)}
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {domain.leads.length === 0 && (
                                <p className="text-sm text-secondary-500 italic">No leads assigned.</p>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
