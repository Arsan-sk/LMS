"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, User, Calendar, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Submission {
    id: string
    status: "PENDING" | "SUBMITTED" | "CHECKED" | "REJECTED"
    createdAt: string
    files: string | null
    answerText: string | null
    user: {
        username: string
        email: string
    }
    assignment?: {
        title: string
    }
    quiz?: {
        title: string
    }
}

export default function LeadSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<"ALL" | "ASSIGNMENT" | "QUIZ">("ALL")

    useEffect(() => {
        fetchSubmissions()
    }, [])

    async function fetchSubmissions() {
        try {
            const res = await fetch("/api/submissions")
            const data = await res.json()
            setSubmissions(data)
        } catch (error) {
            console.error("Failed to fetch submissions", error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredSubmissions = submissions.filter(s => {
        if (filter === "ALL") return true
        if (filter === "ASSIGNMENT") return !!s.assignment
        if (filter === "QUIZ") return !!s.quiz
        return true
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case "CHECKED": return "text-green-600 bg-green-50 ring-green-600/20"
            case "REJECTED": return "text-red-600 bg-red-50 ring-red-600/20"
            case "SUBMITTED": return "text-blue-600 bg-blue-50 ring-blue-600/20"
            default: return "text-yellow-600 bg-yellow-50 ring-yellow-600/20"
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Submissions</h1>
                <p className="text-gray-500">Review and grade member submissions.</p>
            </div>

            <div className="flex space-x-2 border-b border-gray-200 pb-2">
                <Button
                    variant={filter === "ALL" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setFilter("ALL")}
                >
                    All
                </Button>
                <Button
                    variant={filter === "ASSIGNMENT" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setFilter("ASSIGNMENT")}
                >
                    Assignments
                </Button>
                <Button
                    variant={filter === "QUIZ" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setFilter("QUIZ")}
                >
                    Quizzes
                </Button>
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    <p>Loading submissions...</p>
                ) : filteredSubmissions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No submissions found.
                    </div>
                ) : (
                    filteredSubmissions.map((submission) => (
                        <Card key={submission.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(submission.status)}`}>
                                                {submission.status}
                                            </span>
                                            <span className="text-sm text-gray-500 flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {format(new Date(submission.createdAt), "PPP p")}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="font-medium text-lg">
                                                {submission.assignment?.title || submission.quiz?.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 flex items-center mt-1">
                                                <User className="h-3 w-3 mr-1" />
                                                {submission.user.username} ({submission.user.email})
                                            </p>
                                        </div>



                                        {submission.files && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {JSON.parse(submission.files).map((file: string, idx: number) => (
                                                    <a
                                                        key={idx}
                                                        href={file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-sm hover:bg-blue-100"
                                                    >
                                                        <FileText className="h-3 w-3 mr-2" />
                                                        View File {idx + 1}
                                                        <ExternalLink className="h-3 w-3 ml-1" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col justify-center space-y-2 min-w-[120px] text-right">
                                        <Link href={`/dashboard/lead/submissions/${submission.id}`}>
                                            <Button size="sm" variant={submission.status === "CHECKED" ? "outline" : "primary"}>
                                                {submission.status === "CHECKED" ? "Re-grade" : "Grade"}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
