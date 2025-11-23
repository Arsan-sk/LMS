"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Question {
    id: string
    questionText: string
    questionType: "MCQ" | "SHORT_ANSWER" | "LONG_ANSWER"
    options: string // JSON string
    points: number
}

interface Quiz {
    id: string
    title: string
    description: string | null
    totalPoints: number
    questions: Question[]
}

export default function QuizTakePage() {
    const params = useParams()
    const router = useRouter()
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)

    useEffect(() => {
        if (params.id) {
            fetchQuiz()
            checkSubmission()
        }
    }, [params.id])

    async function fetchQuiz() {
        try {
            // Need to fetch quiz with questions. 
            // The list API includes questions count but not questions themselves usually for list.
            // But my GET /api/quizzes implementation includes questions count, but not full questions.
            // Wait, looking at my GET /api/quizzes implementation:
            // include: { ..., _count: { select: { questions: true } } }
            // It DOES NOT include questions. I need to update the API or filter.
            // Actually, I should probably update the API to return questions if a specific ID is requested?
            // Or I can just fetch all and filter, but questions are not in the list response.
            // I need to update GET /api/quizzes to support fetching a single quiz with questions.

            // Let's assume I'll update the API. For now, I'll try to fetch and see.
            // If I can't get questions, I can't render the quiz.
            // I will update the API in the next step.

            const res = await fetch(`/api/quizzes?id=${params.id}`)
            // The current API ignores 'id' param for filtering single item in GET, it only filters by domainId.
            // I need to fix the API.

            // For now, I'll write the frontend code assuming the API works, then fix the API.
            const data = await res.json()
            setQuiz(data)
        } catch (error) {
            console.error("Failed to fetch quiz", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function checkSubmission() {
        try {
            const res = await fetch(`/api/submissions?quizId=${params.id}`)
            const data = await res.json()
            if (data.length > 0) {
                setSubmissionStatus(data[0].status)
            }
        } catch (error) {
            console.error("Failed to check submission", error)
        }
    }

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Format answers for submission
            // The API expects `answerText` or `files`. 
            // For a quiz, we probably want to store the answers structure in `answerText` as JSON?
            // Or we should have a structured way to store quiz answers.
            // The `Submission` model has `answerText` (String).
            // I'll stringify the answers object.

            const res = await fetch("/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quizId: params.id,
                    answerText: JSON.stringify(answers)
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Submission failed")
            }

            setSubmissionStatus("SUBMITTED")
            alert("Quiz submitted successfully!")
            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) return <p>Loading...</p>
    if (!quiz) return <p>Quiz not found or loading failed.</p>

    if (submissionStatus) {
        return (
            <div className="max-w-3xl mx-auto space-y-6 text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h1 className="text-2xl font-bold text-gray-900">Quiz Submitted!</h1>
                <p className="text-gray-500">You have already taken this quiz.</p>
                <Link href="/dashboard/member/quizzes">
                    <Button className="mt-4">Back to Quizzes</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <div className="flex items-center space-x-4">
                <Link href="/dashboard/member/quizzes">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{quiz.title}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {quiz.questions.map((q, index) => (
                    <Card key={q.id}>
                        <CardHeader>
                            <CardTitle className="text-base font-medium">
                                <span className="text-gray-500 mr-2">{index + 1}.</span>
                                {q.questionText}
                                <span className="ml-2 text-xs font-normal text-gray-400">({q.points} pts)</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {q.questionType === "MCQ" && (
                                <div className="space-y-2">
                                    {JSON.parse(q.options as string).map((opt: string, oIdx: number) => (
                                        <div key={oIdx} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={`${q.id}-${oIdx}`}
                                                name={q.id}
                                                value={oIdx}
                                                onChange={() => handleAnswerChange(q.id, oIdx)}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-600 border-gray-300"
                                                required
                                            />
                                            <label htmlFor={`${q.id}-${oIdx}`} className="text-sm text-gray-700">{opt}</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(q.questionType === "SHORT_ANSWER" || q.questionType === "LONG_ANSWER") && (
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Your answer..."
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    required
                                />
                            )}
                        </CardContent>
                    </Card>
                ))}

                <div className="flex justify-end">
                    <Button type="submit" size="lg" isLoading={isSubmitting}>
                        Submit Quiz
                    </Button>
                </div>
            </form>
        </div>
    )
}
