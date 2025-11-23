"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, HelpCircle, CheckCircle, Clock, Edit } from "lucide-react"
import Link from "next/link"

interface Quiz {
    id: string
    title: string
    description: string | null
    totalPoints: number
    published: boolean
    domain: {
        name: string
    }
    _count?: {
        questions: number
    }
}

export default function LeadQuizzesPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchQuizzes()
    }, [])

    async function fetchQuizzes() {
        try {
            const res = await fetch("/api/quizzes")
            const data = await res.json()
            setQuizzes(data)
        } catch (error) {
            console.error("Failed to fetch quizzes", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this quiz?")) return

        try {
            const res = await fetch(`/api/quizzes?id=${id}`, {
                method: "DELETE",
            })

            if (!res.ok) throw new Error("Failed to delete")

            setQuizzes(quizzes.filter((q) => q.id !== id))
        } catch (error) {
            console.error("Delete error:", error)
            alert("Failed to delete quiz")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quizzes</h1>
                    <p className="text-gray-500">Create and manage quizzes for your domain.</p>
                </div>
                <Link href="/dashboard/lead/quizzes/create">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Quiz
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <p>Loading quizzes...</p>
                ) : quizzes.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No quizzes found. Create one to get started.
                    </div>
                ) : (
                    quizzes.map((quiz) => (
                        <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-medium line-clamp-1" title={quiz.title}>
                                            {quiz.title}
                                        </CardTitle>
                                        <p className="text-xs text-gray-500">{quiz.domain.name}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Link href={`/dashboard/lead/quizzes/${quiz.id}/edit`}>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 text-gray-400 hover:text-blue-600">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                                            onClick={() => handleDelete(quiz.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm text-gray-600">
                                    {quiz.description && (
                                        <p className="line-clamp-2 h-10">{quiz.description}</p>
                                    )}

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center">
                                            <HelpCircle className="mr-2 h-4 w-4 text-gray-400" />
                                            <span>{quiz._count?.questions || 0} Questions</span>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${quiz.published ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20'}`}>
                                            {quiz.published ? "Published" : "Draft"}
                                        </span>
                                    </div>

                                    <div className="flex items-center pt-1">
                                        <CheckCircle className="mr-2 h-4 w-4 text-gray-400" />
                                        <span>Total Points: {quiz.totalPoints}</span>
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
