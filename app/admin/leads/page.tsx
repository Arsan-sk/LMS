"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search, User, Trash2 } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"

interface Lead {
    id: string
    username: string
    email: string
    ledDomains: { domain: { name: string } }[]
}

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchLeads()
    }, [])

    async function fetchLeads() {
        try {
            const res = await fetch("/api/admin/leads/list")
            const data = await res.json()
            setLeads(data)
        } catch (error) {
            console.error("Failed to fetch leads", error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredLeads = leads.filter(lead =>
        lead.username.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manage Leads</h1>
                    <p className="text-gray-500">View and manage domain leads.</p>
                </div>
                <Link href="/admin/leads/create">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Lead
                    </Button>
                </Link>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search leads..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    <p>Loading leads...</p>
                ) : filteredLeads.length === 0 ? (
                    <p>No leads found.</p>
                ) : (
                    filteredLeads.map((lead) => (
                        <Card key={lead.id}>
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                        {lead.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{lead.username}</p>
                                        <p className="text-sm text-gray-500">{lead.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">Domains</p>
                                        <p className="text-sm text-gray-500">
                                            {lead.ledDomains.map(d => d.domain.name).join(", ")}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
