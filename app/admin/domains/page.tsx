"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Settings } from "lucide-react"
import { EditDomainDialog } from "@/components/edit-domain-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface Domain {
    id: string
    name: string
    description: string | null
    maxCapacity: number
    _count: {
        users: number
        leads: number
        resources: number
    }
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

export default function AdminDomainsPage() {
    const [domains, setDomains] = useState<Domain[]>([])
    const [availableLeads, setAvailableLeads] = useState<Lead[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    // Create Domain State
    const [newDomainName, setNewDomainName] = useState("")
    const [newDomainDesc, setNewDomainDesc] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    useEffect(() => {
        Promise.all([fetchDomains(), fetchLeads()])
            .finally(() => setIsLoading(false))
    }, [])

    async function fetchDomains() {
        try {
            const res = await fetch("/api/admin/domains/list")
            const data = await res.json()
            setDomains(data)
        } catch (error) {
            console.error("Failed to fetch domains", error)
        }
    }

    async function fetchLeads() {
        try {
            const res = await fetch("/api/users/leads")
            const data = await res.json()
            setAvailableLeads(data)
        } catch (error) {
            console.error("Failed to fetch leads", error)
        }
    }

    async function handleCreateDomain(e: React.FormEvent) {
        e.preventDefault()
        setIsCreating(true)
        setCreateError(null)
        try {
            const res = await fetch("/api/admin/domains", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: newDomainName, description: newDomainDesc || null }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.message || "Failed to create domain")
            }

            await fetchDomains() // Refresh the list of domains
            setIsCreateOpen(false)
            setNewDomainName("")
            setNewDomainDesc("")
        } catch (error: any) {
            setCreateError(error.message)
            console.error("Failed to create domain", error)
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-graphite">Manage Domains</h1>
                    <p className="text-secondary-500">Configure domains and view statistics.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg shadow-primary-500/20">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Domain
                </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <p>Loading domains...</p>
                ) : (
                    domains.map((domain) => (
                        <Card key={domain.id} className="shadow-glow border-none hover:shadow-lg transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-medium text-neutral-graphite">{domain.name}</CardTitle>
                                <Settings className="h-4 w-4 text-secondary-400" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-secondary-500 mb-4 h-10 line-clamp-2">{domain.description || "No description"}</p>
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary-500">Members</span>
                                        <span className="font-medium text-neutral-graphite">{domain._count.users} / {domain.maxCapacity}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary-500">Leads</span>
                                        <span className="font-medium text-neutral-graphite">{domain._count.leads}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary-500">Resources</span>
                                        <span className="font-medium text-neutral-graphite">{domain._count.resources}</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-secondary-100">
                                    <p className="text-xs font-medium text-secondary-400 mb-2">Current Lead(s):</p>
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {domain.leads.length > 0 ? (
                                            domain.leads.map(lead => (
                                                <span key={lead.userId} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-700">
                                                    {lead.user.username}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-secondary-400 italic">Unassigned</span>
                                        )}
                                    </div>

                                    <EditDomainDialog domain={domain} availableLeads={availableLeads} onUpdate={fetchDomains} />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Domain</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateDomain} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Name</label>
                            <Input
                                id="name"
                                placeholder="Domain Name (e.g., Cloud Computing)"
                                value={newDomainName}
                                onChange={(e) => setNewDomainName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
                            <Input
                                id="description"
                                placeholder="Description (Optional)"
                                value={newDomainDesc}
                                onChange={(e) => setNewDomainDesc(e.target.value)}
                            />
                        </div>
                        {createError && <p className="text-sm text-red-600">{createError}</p>}
                        <div className="flex justify-end space-x-2 mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isCreating}>
                                Create Domain
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
