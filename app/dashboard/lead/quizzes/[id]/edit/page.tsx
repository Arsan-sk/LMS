"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { QuizForm } from "@/components/quiz-form"

interface Domain {
    id: string
    name: string
}

export default function EditQuizPage() {
    const params = useParams()
    const [domains, setDomains] = useState<Domain[]>([])
    const [quiz, setQuiz] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        Promise.all([fetchDomains(), fetchQuiz()])
            .finally(() => setIsLoading(false))
    }, [])

    async function fetchDomains() {
        try {
            const res = await fetch("/api/lead/domains")
            const data = await res.json()
            setDomains(data)
        } catch (error) {
            console.error("Failed to fetch domains", error)
        }
    }

    async function fetchQuiz() {
        try {
            // We need to fetch the full quiz details including questions.
            // The GET /api/quizzes endpoint now supports fetching by ID with questions.
            const res = await fetch(`/api/quizzes?id=${params.id}`)
            const data = await res.json()

            // Transform data to match form structure if needed
            // The API returns questions with options as string, form expects string[]?
            // Wait, my form expects options as string[] but API returns JSON string.
            // I need to parse options and correctAnswer.

            const formattedQuiz = {
                ...data,
                questions: data.questions.map((q: any) => ({
                    ...q,
                    options: q.options ? JSON.parse(q.options) : [],
                    // correctAnswer might be stored as JSON string too if it was an object, 
                    // but for MCQ it's usually an index string. 
                    // Let's check how I stored it. 
                    // In POST/PUT: correctAnswer: q.correctAnswer ? JSON.stringify(q.correctAnswer) : undefined
                    // So I need to parse it.
                    correctAnswer: q.correctAnswer ? JSON.parse(q.correctAnswer) : ""
                }))
            }

            setQuiz(formattedQuiz)
        } catch (error) {
            console.error("Failed to fetch quiz", error)
        }
    }

    if (isLoading) return <p>Loading...</p>
    if (!quiz) return <p>Quiz not found</p>

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center space-x-4">
                <Link href="/dashboard/lead/quizzes">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Edit Quiz</h1>
            </div>

            <QuizForm
                domains={domains}
                initialData={quiz}
                isEditing={true}
            />
        </div>
    )
}
