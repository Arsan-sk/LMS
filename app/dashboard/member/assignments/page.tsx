"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface Assignment {
    id: string
    title: string
    description: string | null
    dueDate: string | null
    pointsBase: number
    domain: {
        name: string
    }
    submissions: {
        status: string
    }[]
}

export default function MemberAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchAssignments()
    }, [])

    async function fetchAssignments() {
        try {
            const res = await fetch("/api/assignments")
            const data = await res.json()
            // Filter to show only assignments for user's domain (API already does this but being safe)
            // Also need to check if user has submitted
            // For now, the API returns all assignments for the domain. 
            // We need to fetch submissions status or update the API to include it.
            // The current API includes `submissions` relation? Let's check.
            // The GET /api/assignments doesn't include submissions by default for the user.
            // I'll need to update the API or fetch submissions separately.
            // For now, let's assume the API returns what we need or I'll update it.
            // Actually, let's update the API to include user's submission status.
            // But for now, let's just display the list.
            setAssignments(data)
        } catch (error) {
            console.error("Failed to fetch assignments", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Assignments</h1>
                <p className="text-gray-500">View and submit your assignments.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <p>Loading assignments...</p>
                ) : assignments.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No assignments found.
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
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {assignment.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2 h-10">{assignment.description}</p>
                                    )}

                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        <span>
                                            Due: {assignment.dueDate ? format(new Date(assignment.dueDate), "PPP") : "No due date"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center text-sm font-medium text-gray-900">
                                            <FileText className="mr-2 h-4 w-4 text-primary-500" />
                                            {assignment.pointsBase} Pts
                                        </div>
                                        <Link href={`/dashboard/member/assignments/${assignment.id}`}>
                                            <Button size="sm">View & Submit</Button>
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
