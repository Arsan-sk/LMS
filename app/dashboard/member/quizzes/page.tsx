"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

interface Quiz {
    id: string
    title: string
    description: string | null
    totalPoints: number
    domain: {
        name: string
    }
    _count?: {
        questions: number
    }
}

export default function MemberQuizzesPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchQuizzes()
    }, [])

    async function fetchQuizzes() {
        try {
            const res = await fetch("/api/quizzes")
            const data = await res.json()
            // Filter only published quizzes
            const published = data.filter((q: any) => q.published)
            setQuizzes(published)
        } catch (error) {
            console.error("Failed to fetch quizzes", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quizzes</h1>
                <p className="text-gray-500">Test your knowledge with quizzes.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <p>Loading quizzes...</p>
                ) : quizzes.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No quizzes available at the moment.
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
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {quiz.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2 h-10">{quiz.description}</p>
                                    )}

                                    <div className="flex items-center text-sm text-gray-500">
                                        <HelpCircle className="mr-2 h-4 w-4" />
                                        <span>{quiz._count?.questions || 0} Questions</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center text-sm font-medium text-gray-900">
                                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                            {quiz.totalPoints} Pts
                                        </div>
                                        <Link href={`/dashboard/member/quizzes/${quiz.id}`}>
                                            <Button size="sm">Start Quiz</Button>
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
