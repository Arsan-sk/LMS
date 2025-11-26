"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Upload, Link as LinkIcon, Video, FileText, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { clsx } from "clsx"
import { uploadFile } from "@/lib/upload"

interface Domain {
    id: string
    name: string
}

export default function CreateResourcePage() {
    const router = useRouter()
    const [domains, setDomains] = useState<Domain[]>([])
    const [uploadMode, setUploadMode] = useState<"FILE" | "LINK">("LINK")

    // Form State
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState<string>("EXTERNAL_LINK")
    const [url, setUrl] = useState("")
    const [selectedDomain, setSelectedDomain] = useState("")
    const [file, setFile] = useState<File | null>(null)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchDomains()
    }, [])

    async function fetchDomains() {
        try {
            const res = await fetch("/api/lead/domains")
            const data = await res.json()
            setDomains(data)
            if (data.length > 0) {
                setSelectedDomain(data[0].id)
            }
        } catch (error) {
            console.error("Failed to fetch domains", error)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)

            // Auto-detect type
            if (selectedFile.type.startsWith("image/")) {
                setType("IMAGE")
            } else if (selectedFile.type.startsWith("video/")) {
                setType("VIDEO")
            } else if (selectedFile.type === "application/pdf") {
                setType("PDF")
            } else {
                setType("DOC")
            }
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            let finalUrl = url
            let finalType = type

            if (uploadMode === "FILE" && file) {
                finalUrl = await uploadFile(file)
            }

            const res = await fetch("/api/resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description: description || undefined,
                    type: finalType,
                    url: finalUrl,
                    domainId: selectedDomain,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Failed to create resource")
            }

            router.push("/dashboard/lead/resources")
            router.refresh()
        } catch (error: any) {
            setError(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/dashboard/lead/resources">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Add New Resource</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Upload Mode Toggle */}
                    <div className="flex space-x-4 border-b border-gray-200 pb-4">
                        <button
                            type="button"
                            onClick={() => setUploadMode("LINK")}
                            className={clsx("text-sm font-medium pb-1", uploadMode === "LINK" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500")}
                        >
                            External Link
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadMode("FILE")}
                            className={clsx("text-sm font-medium pb-1", uploadMode === "FILE" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500")}
                        >
                            Upload File
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Resource Title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-graphite">Domain</label>
                        {domains.length === 1 ? (
                            <div className="flex h-10 w-full items-center rounded-md border border-secondary-200 bg-secondary-50 px-3 py-2 text-sm text-secondary-600">
                                {domains[0].name}
                            </div>
                        ) : (
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedDomain}
                                onChange={(e) => setSelectedDomain(e.target.value)}
                                required
                            >
                                {domains.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {uploadMode === "LINK" ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="EXTERNAL_LINK">External Link</option>
                                    <option value="DRIVE_LINK">Google Drive</option>
                                    <option value="VIDEO">Video URL</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">URL</label>
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://..."
                                    type="url"
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">File</label>
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                                        <p className="text-xs text-gray-500">{file ? file.name : "SVG, PNG, JPG, PDF, DOCX, MP4"}</p>
                                    </div>
                                    <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
                                </label>
                            </div>
                            {file && (
                                <p className="text-xs text-green-600">Detected Type: {type}</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description (Optional)</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description..."
                        />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex justify-end space-x-2 pt-4">
                        <Link href="/dashboard/lead/resources">
                            <Button type="button" variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" isLoading={isSubmitting}>
                            {uploadMode === "FILE" ? "Upload & Create" : "Add Resource"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
