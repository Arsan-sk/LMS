"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Domain {
    id: string
    name: string
}

export default function CreateAssignmentPage() {
    const router = useRouter()
    const [domains, setDomains] = useState<Domain[]>([])

    // Form State
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [pointsBase, setPointsBase] = useState(100)
    const [timelyBonusPoints, setTimelyBonusPoints] = useState(10)
    const [submissionType, setSubmissionType] = useState<"FILE" | "IN_PERSON">("FILE")
    const [selectedDomain, setSelectedDomain] = useState("")
    const [published, setPublished] = useState(true)

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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            const res = await fetch("/api/assignments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description: description || undefined,
                    dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                    domainId: selectedDomain,
                    pointsBase: Number(pointsBase),
                    timelyBonusPoints: Number(timelyBonusPoints),
                    submissionType,
                    published,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Failed to create assignment")
            }

            router.push("/dashboard/lead/assignments")
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
                <Link href="/dashboard/lead/assignments">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create Assignment</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Assignment Title"
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

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description (Optional)</label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detailed instructions..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Due Date</label>
                            <Input
                                type="datetime-local"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Submission Type</label>
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={submissionType}
                                onChange={(e) => setSubmissionType(e.target.value as "FILE" | "IN_PERSON")}
                            >
                                <option value="FILE">File Upload</option>
                                <option value="IN_PERSON">In Person / Manual</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Base Points</label>
                            <Input
                                type="number"
                                min="0"
                                value={pointsBase}
                                onChange={(e) => setPointsBase(Number(e.target.value))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Timely Bonus Points</label>
                            <Input
                                type="number"
                                min="0"
                                value={timelyBonusPoints}
                                onChange={(e) => setTimelyBonusPoints(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="published"
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                            checked={published}
                            onChange={(e) => setPublished(e.target.checked)}
                        />
                        <label htmlFor="published" className="text-sm font-medium text-gray-900">Publish immediately</label>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex justify-end space-x-2 pt-4">
                        <Link href="/dashboard/lead/assignments">
                            <Button type="button" variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" isLoading={isSubmitting}>
                            Create Assignment
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
