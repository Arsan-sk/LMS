"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, ExternalLink, FileText, Video, Link as LinkIcon, Image as ImageIcon, File } from "lucide-react"
import { useSession } from "next-auth/react"
import { clsx } from "clsx"
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

const TABS = [
    { id: "ALL", label: "All Resources" },
    { id: "VIDEO", label: "Videos" },
    { id: "DOCUMENT", label: "Documents" },
    { id: "IMAGE", label: "Images" },
    { id: "LINK", label: "Links" },
]

export default function MemberResourcesPage() {
    const { data: session } = useSession()
    const [resources, setResources] = useState<Resource[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState("ALL")
    const [selectedVideo, setSelectedVideo] = useState<Resource | null>(null)

    useEffect(() => {
        if (session?.user?.domainId) {
            fetchResources(session.user.domainId)
        } else if (session && !session.user.domainId) {
            setIsLoading(false)
        }
    }, [session])

    async function fetchResources(domainId: string) {
        try {
            const res = await fetch(`/api/resources?domainId=${domainId}`)
            const data = await res.json()
            setResources(data)
        } catch (error) {
            console.error("Failed to fetch resources", error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.description?.toLowerCase().includes(search.toLowerCase())

        let matchesTab = true
        if (activeTab === "VIDEO") matchesTab = r.type === "VIDEO"
        if (activeTab === "DOCUMENT") matchesTab = ["DOC", "PDF"].includes(r.type)
        if (activeTab === "IMAGE") matchesTab = r.type === "IMAGE"
        if (activeTab === "LINK") matchesTab = ["EXTERNAL_LINK", "DRIVE_LINK"].includes(r.type)

        return matchesSearch && matchesTab
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

    if (!session) return null

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-graphite">Resource Library</h1>
                <p className="text-secondary-500">Access learning materials for your domain.</p>
            </div>

            <div className="border-b border-secondary-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                activeTab === tab.id
                                    ? "border-primary-500 text-primary-600"
                                    : "border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700",
                                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400" />
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
                ) : !session.user.domainId ? (
                    <p>You are not assigned to any domain. Please contact an admin.</p>
                ) : filteredResources.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-secondary-500">
                        No resources found in this category.
                    </div>
                ) : (
                    filteredResources.map((resource) => (
                        <Card key={resource.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group border-none shadow-glow">
                            {resource.type === "IMAGE" && (
                                <div className="h-32 w-full bg-secondary-100 relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={resource.url} alt={resource.title} className="h-full w-full object-cover" />
                                </div>
                            )}
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-secondary-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                                            {getIcon(resource.type)}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-neutral-graphite line-clamp-1" title={resource.title}>{resource.title}</h3>
                                            <p className="text-xs text-secondary-500">{resource.type}</p>
                                        </div>
                                    </div>
                                </div>

                                {resource.description && (
                                    <p className="mt-2 text-sm text-secondary-500 line-clamp-2">{resource.description}</p>
                                )}

                                <div className="mt-4">
                                    {resource.type === "VIDEO" ? (
                                        <button
                                            onClick={() => setSelectedVideo(resource)}
                                            className="inline-flex w-full items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                                        >
                                            Watch Video <Video className="ml-2 h-4 w-4" />
                                        </button>
                                    ) : (
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex w-full items-center justify-center rounded-md bg-secondary-100 px-4 py-2 text-sm font-medium text-secondary-900 shadow-sm hover:bg-secondary-200 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 transition-colors"
                                        >
                                            Open Resource <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    )}
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
