"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Calendar, FileText, Trash2, Users } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface Assignment {
    id: string
    title: string
    description: string | null
    dueDate: string | null
    pointsBase: number
    submissionType: "FILE" | "IN_PERSON"
    domain: {
        name: string
    }
    _count?: {
        submissions: number
    }
}

export default function LeadAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchAssignments()
    }, [])

    async function fetchAssignments() {
        try {
            const res = await fetch("/api/assignments")
            const data = await res.json()
            setAssignments(data)
        } catch (error) {
            console.error("Failed to fetch assignments", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this assignment?")) return

        try {
            const res = await fetch(`/api/assignments?id=${id}`, {
                method: "DELETE",
            })

            if (!res.ok) throw new Error("Failed to delete")

            setAssignments(assignments.filter((a) => a.id !== id))
        } catch (error) {
            console.error("Delete error:", error)
            alert("Failed to delete assignment")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Assignments</h1>
                    <p className="text-gray-500">Create and manage assignments for your domain.</p>
                </div>
                <Link href="/dashboard/lead/assignments/create">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Assignment
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <p>Loading assignments...</p>
                ) : assignments.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No assignments found. Create one to get started.
                    </div>
                ) : (
                    assignments.map((assignment) => (
                        <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-medium line-clamp-1" title={assignment.title}>
                                            {assignment.title}
                                        </CardTitle>
                                        <p className="text-xs text-gray-500">{assignment.domain.name}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                                        onClick={() => handleDelete(assignment.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm text-gray-600">
                                    {assignment.description && (
                                        <p className="line-clamp-2 h-10">{assignment.description}</p>
                                    )}

                                    <div className="flex items-center pt-2">
                                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                        <span>
                                            Due: {assignment.dueDate ? format(new Date(assignment.dueDate), "PPP") : "No due date"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center">
                                            <FileText className="mr-2 h-4 w-4 text-gray-400" />
                                            <span>{assignment.pointsBase} Pts</span>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                            {assignment.submissionType === "FILE" ? "File Upload" : "In Person"}
                                        </span>
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
