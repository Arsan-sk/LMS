"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, CheckCircle, XCircle, FileText, ExternalLink, Save } from "lucide-react"
import Link from "next/link"

export default function GradingPage() {
    const params = useParams()
    const router = useRouter()
    const [submission, setSubmission] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [gradePoints, setGradePoints] = useState<number>(0)
    const [feedback, setFeedback] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // For quiz grading
    const [questionScores, setQuestionScores] = useState<Record<string, number>>({})

    useEffect(() => {
        fetchSubmission()
    }, [])

    async function fetchSubmission() {
        try {
            const res = await fetch(`/api/submissions?id=${params.id}`)
            const data = await res.json()
            setSubmission(data)

            if (data.quiz) {
                // Auto-grade quiz
                const scores: Record<string, number> = {}
                let total = 0
                const userAnswers = data.answerText ? JSON.parse(data.answerText) : {}

                data.quiz.questions.forEach((q: any) => {
                    const userAnswer = userAnswers[q.id]
                    let points = 0

                    if (q.questionType === "MCQ") {
                        // Compare indices or values. Assuming stored as string index.
                        // Correct answer in DB might be JSON string of index or value.
                        // Let's try to parse if stringified.
                        let correct = q.correctAnswer
                        try { correct = JSON.parse(q.correctAnswer) } catch { }

                        if (userAnswer === correct || userAnswer === String(correct)) {
                            points = q.points
                        }
                    }
                    // For text answers, default to 0 or maybe full if we want to be generous by default? 
                    // Better 0 and let teacher grade.

                    scores[q.id] = points
                    total += points
                })
                setQuestionScores(scores)
                setGradePoints(total)
            } else if (data.gradePoints) {
                setGradePoints(data.gradePoints)
            }
        } catch (error) {
            console.error("Failed to fetch submission", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleQuestionScoreChange = (questionId: string, score: number) => {
        const newScores = { ...questionScores, [questionId]: score }
        setQuestionScores(newScores)

        // Recalculate total
        const total = Object.values(newScores).reduce((sum, s) => sum + s, 0)
        setGradePoints(total)
    }

    async function handleGrade(status: "CHECKED" | "REJECTED") {
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/submissions", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: params.id,
                    status,
                    gradePoints: status === "CHECKED" ? gradePoints : 0,
                    feedback
                })
            })

            if (!res.ok) throw new Error("Failed to grade")

            router.push("/dashboard/lead/submissions")
            router.refresh()
        } catch (error) {
            console.error("Grading error", error)
            alert("Failed to submit grade")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) return <p>Loading submission...</p>
    if (!submission) return <p>Submission not found</p>

    const isQuiz = !!submission.quiz
    const userAnswers = isQuiz && submission.answerText ? JSON.parse(submission.answerText) : {}

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center space-x-4">
                <Link href="/dashboard/lead/submissions">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Grading: {submission.user.username}
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {isQuiz ? `Quiz: ${submission.quiz.title}` : `Assignment: ${submission.assignment.title}`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Submitted on: {new Date(submission.createdAt).toLocaleDateString()}</span>
                        <span>Status: <span className="font-medium text-gray-900">{submission.status}</span></span>
                    </div>

                    {!isQuiz && (
                        <div className="space-y-4 pt-4 border-t">
                            {submission.answerText && (
                                <div className="bg-gray-50 p-4 rounded-md">
                                    <h3 className="font-medium mb-2">Text Answer:</h3>
                                    <p className="whitespace-pre-wrap">{submission.answerText}</p>
                                </div>
                            )}
                            {submission.files && JSON.parse(submission.files as string).length > 0 && (
                                <div>
                                    <h3 className="font-medium mb-2">Attached Files:</h3>
                                    <div className="space-y-2">
                                        {JSON.parse(submission.files as string).map((url: string, i: number) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                                                <FileText className="h-4 w-4 mr-2" />
                                                Attachment {i + 1}
                                                <ExternalLink className="h-3 w-3 ml-1" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {isQuiz && (
                        <div className="space-y-6 pt-4 border-t">
                            {submission.quiz.questions.map((q: any, index: number) => {
                                const userAnswer = userAnswers[q.id]
                                const options = q.options ? JSON.parse(q.options) : []
                                let correctAnswer = q.correctAnswer
                                try { correctAnswer = JSON.parse(q.correctAnswer) } catch { }

                                const isCorrect = userAnswer === String(correctAnswer)

                                return (
                                    <div key={q.id} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-medium">Q{index + 1}: {q.questionText}</h3>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-500">Score:</span>
                                                <Input
                                                    type="number"
                                                    className="w-20 h-8"
                                                    value={questionScores[q.id] || 0}
                                                    onChange={(e) => handleQuestionScoreChange(q.id, parseInt(e.target.value) || 0)}
                                                    max={q.points}
                                                />
                                                <span className="text-sm text-gray-400">/ {q.points}</span>
                                            </div>
                                        </div>

                                        {q.questionType === "MCQ" ? (
                                            <div className="space-y-2">
                                                {options.map((opt: string, i: number) => {
                                                    const isSelected = userAnswer === String(i)
                                                    const isOptionCorrect = String(correctAnswer) === String(i)

                                                    let className = "p-2 rounded border "
                                                    if (isSelected && isOptionCorrect) className += "bg-green-50 border-green-200 text-green-800"
                                                    else if (isSelected && !isOptionCorrect) className += "bg-red-50 border-red-200 text-red-800"
                                                    else if (isOptionCorrect) className += "bg-green-50 border-green-200 border-dashed"
                                                    else className += "border-gray-100"

                                                    return (
                                                        <div key={i} className={className}>
                                                            <div className="flex items-center">
                                                                <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${isSelected ? 'border-current' : 'border-gray-300'}`}>
                                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-current" />}
                                                                </div>
                                                                {opt}
                                                                {isOptionCorrect && <CheckCircle className="h-4 w-4 ml-auto text-green-600" />}
                                                                {isSelected && !isOptionCorrect && <XCircle className="h-4 w-4 ml-auto text-red-600" />}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 p-3 rounded">
                                                <p className="text-sm font-medium text-gray-500 mb-1">User Answer:</p>
                                                <p>{userAnswer || "No answer provided"}</p>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className="pt-6 border-t space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="font-medium">Total Grade Points</label>
                            <div className="text-2xl font-bold text-primary-600">
                                {gradePoints}
                            </div>
                        </div>

                        {!isQuiz && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Points Adjustment</label>
                                <Input
                                    type="number"
                                    value={gradePoints}
                                    onChange={(e) => setGradePoints(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Feedback (Optional)</label>
                            <Input
                                placeholder="Good job! / Needs improvement..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end space-x-4 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => handleGrade("REJECTED")}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={isSubmitting}
                            >
                                Reject Submission
                            </Button>
                            <Button
                                onClick={() => handleGrade("CHECKED")}
                                disabled={isSubmitting}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Save & Grade
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
