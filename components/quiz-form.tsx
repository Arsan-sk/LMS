"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, Save, Send } from "lucide-react"

interface Question {
    questionText: string
    questionType: "MCQ" | "SHORT_ANSWER" | "LONG_ANSWER"
    options: string[]
    correctAnswer: string
    points: number
}

interface Domain {
    id: string
    name: string
}

interface QuizFormProps {
    initialData?: {
        id?: string
        title: string
        description: string
        domainId: string
        published: boolean
        questions: Question[]
    }
    domains: Domain[]
    isEditing?: boolean
}

export function QuizForm({ initialData, domains, isEditing = false }: QuizFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [title, setTitle] = useState(initialData?.title || "")
    const [description, setDescription] = useState(initialData?.description || "")
    const [domainId, setDomainId] = useState(initialData?.domainId || "")
    const [questions, setQuestions] = useState<Question[]>(initialData?.questions || [])

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                questionText: "",
                questionType: "MCQ",
                options: ["Option 1", "Option 2"],
                correctAnswer: "0",
                points: 1
            }
        ])
    }

    const removeQuestion = (index: number) => {
        const newQuestions = [...questions]
        newQuestions.splice(index, 1)
        setQuestions(newQuestions)
    }

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions]
        newQuestions[index] = { ...newQuestions[index], [field]: value }
        setQuestions(newQuestions)
    }

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions]
        const newOptions = [...newQuestions[qIndex].options]
        newOptions[oIndex] = value
        newQuestions[qIndex].options = newOptions
        setQuestions(newQuestions)
    }

    const addOption = (qIndex: number) => {
        const newQuestions = [...questions]
        newQuestions[qIndex].options.push(`Option ${newQuestions[qIndex].options.length + 1}`)
        setQuestions(newQuestions)
    }

    const removeOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions]
        newQuestions[qIndex].options.splice(oIndex, 1)
        setQuestions(newQuestions)
    }

    async function handleSubmit(published: boolean) {
        setIsLoading(true)

        try {
            const payload = {
                title,
                description,
                domainId,
                published,
                questions
            }

            let res
            if (isEditing && initialData?.id) {
                res = await fetch("/api/quizzes", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: initialData.id, ...payload })
                })
            } else {
                res = await fetch("/api/quizzes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
            }

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Failed to save quiz")
            }

            router.push("/dashboard/lead/quizzes")
            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Quiz Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            placeholder="Quiz Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Input
                            placeholder="Description (Optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Domain</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={domainId}
                            onChange={(e) => setDomainId(e.target.value)}
                            required
                        >
                            <option value="">Select Domain</option>
                            {domains.map((domain) => (
                                <option key={domain.id} value={domain.id}>
                                    {domain.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Questions</h2>
                    <Button onClick={addQuestion} variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Question
                    </Button>
                </div>

                {questions.map((q, qIndex) => (
                    <Card key={qIndex} className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2 text-red-500 hover:text-red-700"
                            onClick={() => removeQuestion(qIndex)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Question Text</label>
                                    <Input
                                        value={q.questionText}
                                        onChange={(e) => updateQuestion(qIndex, "questionText", e.target.value)}
                                        placeholder="Enter question"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Type</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={q.questionType}
                                        onChange={(e) => updateQuestion(qIndex, "questionType", e.target.value)}
                                    >
                                        <option value="MCQ">Multiple Choice</option>
                                        <option value="SHORT_ANSWER">Short Answer</option>
                                        <option value="LONG_ANSWER">Long Answer</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Points</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={q.points}
                                    onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value))}
                                    className="w-24"
                                />
                            </div>

                            {q.questionType === "MCQ" && (
                                <div className="space-y-2 bg-gray-50 p-4 rounded-md">
                                    <label className="text-sm font-medium">Options</label>
                                    {q.options.map((opt, oIndex) => (
                                        <div key={oIndex} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name={`correct-${qIndex}`}
                                                checked={q.correctAnswer === oIndex.toString()}
                                                onChange={() => updateQuestion(qIndex, "correctAnswer", oIndex.toString())}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-600 border-gray-300"
                                            />
                                            <Input
                                                value={opt}
                                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                className="flex-1"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeOption(qIndex, oIndex)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addOption(qIndex)}
                                        className="text-primary-600 hover:text-primary-700"
                                    >
                                        <PlusCircle className="mr-2 h-3 w-3" />
                                        Add Option
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-end space-x-4">
                <Button
                    variant="outline"
                    onClick={() => handleSubmit(false)}
                    isLoading={isLoading}
                >
                    <Save className="mr-2 h-4 w-4" />
                    Save as Draft
                </Button>
                <Button
                    onClick={() => handleSubmit(true)}
                    isLoading={isLoading}
                >
                    <Send className="mr-2 h-4 w-4" />
                    {isEditing ? "Update & Publish" : "Create & Publish"}
                </Button>
            </div>
        </div>
    )
}
