"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, ExternalLink, FileText, Video, Link as LinkIcon, Trash2, Image as ImageIcon, File } from "lucide-react"
import { useSession } from "next-auth/react"
import { clsx } from "clsx"
import Link from "next/link"
import { VideoModal } from "@/components/video-modal"

interface Resource {
    id: string
    title: string
    description: string | null
    type: "VIDEO" | "DOCUMENT" | "LINK" | "IMAGE" | "PDF" | "DOC" | "DRIVE_LINK" | "EXTERNAL_LINK"
    url: string
    createdAt: string
    domain: {
        name: string
    }
}

interface Domain {
    id: string
    name: string
}

const TABS = [
    { id: "ALL", label: "All Resources" },
    { id: "VIDEO", label: "Videos" },
    { id: "DOCUMENT", label: "Documents" },
    { id: "IMAGE", label: "Images" },
    { id: "LINK", label: "Links" },
]

export default function LeadResourcesPage() {
    const { data: session } = useSession()
    const [resources, setResources] = useState<Resource[]>([])
    const [domains, setDomains] = useState<Domain[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState("ALL")
    const [selectedVideo, setSelectedVideo] = useState<Resource | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [domainsRes, resourcesRes] = await Promise.all([
                fetch("/api/lead/domains"),
                fetch("/api/resources")
            ])

            const domainsData = await domainsRes.json()
            setDomains(domainsData)

            const resourcesData = await resourcesRes.json()
            setResources(resourcesData)

        } catch (error) {
            console.error("Failed to fetch data", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDeleteResource(id: string) {
        if (!confirm("Are you sure you want to delete this resource?")) return

        try {
            const res = await fetch(`/api/resources?id=${id}`, {
                method: "DELETE"
            })

            if (!res.ok) {
                throw new Error("Failed to delete resource")
            }

            setResources(resources.filter(r => r.id !== id))
        } catch (error) {
            console.error("Delete error:", error)
            alert("Failed to delete resource")
        }
    }

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase())
        const isManagedDomain = domains.some(d => d.name === r.domain.name)

        let matchesTab = true
        if (activeTab === "VIDEO") matchesTab = r.type === "VIDEO"
        if (activeTab === "DOCUMENT") matchesTab = ["DOC", "PDF"].includes(r.type)
        if (activeTab === "IMAGE") matchesTab = r.type === "IMAGE"
        if (activeTab === "LINK") matchesTab = ["EXTERNAL_LINK", "DRIVE_LINK"].includes(r.type)

        return matchesSearch && isManagedDomain && matchesTab
    })

    const getIcon = (type: string) => {
        switch (type) {
            case "VIDEO": return <Video className="h-6 w-6 text-blue-500" />
            case "PDF": return <FileText className="h-6 w-6 text-red-500" />
            case "DOC": return <File className="h-6 w-6 text-blue-400" />
            case "IMAGE": return <ImageIcon className="h-6 w-6 text-purple-500" />
            default: return <LinkIcon className="h-6 w-6 text-green-500" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Resources</h1>
                    <p className="text-gray-500">Manage and upload learning materials.</p>
                </div>
                <Link href="/dashboard/lead/resources/create">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Resource
                    </Button>
                </Link>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                activeTab === tab.id
                                    ? "border-primary-500 text-primary-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search resources..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <p>Loading resources...</p>
                ) : filteredResources.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No resources found in this category.
                    </div>
                ) : (
                    filteredResources.map((resource) => (
                        <Card key={resource.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            {resource.type === "IMAGE" && (
                                <div className="h-32 w-full bg-gray-100 relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={resource.url} alt={resource.title} className="h-full w-full object-cover" />
                                </div>
                            )}
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            {getIcon(resource.type)}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900 line-clamp-1" title={resource.title}>{resource.title}</h3>
                                            <p className="text-xs text-gray-500">{resource.domain.name}</p>
                                        </div>
                                    </div>
                                </div>

                                {resource.description && (
                                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{resource.description}</p>
                                )}

                                <div className="mt-4 flex items-center justify-between">
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                        {resource.type}
                                    </span>
                                    <div className="flex space-x-2">
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                        {resource.type === "VIDEO" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => setSelectedVideo(resource)}
                                            >
                                                <Video className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDeleteResource(resource.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {selectedVideo && (
                <VideoModal
                    isOpen={!!selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                    videoUrl={selectedVideo.url}
                    title={selectedVideo.title}
                />
            )}
        </div>
    )
}
