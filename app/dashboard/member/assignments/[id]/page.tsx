"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Upload, FileText, CheckCircle } from "lucide-react"
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
}

export default function AssignmentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [file, setFile] = useState<File | null>(null)
    const [answerText, setAnswerText] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submissionStatus, setSubmissionStatus] = useState<string | null>(null)

    useEffect(() => {
        if (params.id) {
            fetchAssignment()
            checkSubmission()
        }
    }, [params.id])

    async function fetchAssignment() {
        try {
            // We need a specific endpoint or filter for single assignment
            // Re-using list endpoint for now and filtering client side is inefficient but works for prototype
            // Ideally: GET /api/assignments?id=...
            // But current API returns list. Let's use the list endpoint and find it.
            const res = await fetch(`/api/assignments`)
            const data = await res.json()
            const found = data.find((a: any) => a.id === params.id)
            setAssignment(found)
        } catch (error) {
            console.error("Failed to fetch assignment", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function checkSubmission() {
        try {
            const res = await fetch(`/api/submissions?assignmentId=${params.id}&userId=me`) // userId=me is handled by session in API? No, API expects userId or defaults to session if role is MEMBER
            // Actually my API implementation for GET /api/submissions filters by session.user.id if role is MEMBER
            // So just passing assignmentId is enough
            const res2 = await fetch(`/api/submissions?assignmentId=${params.id}`)
            const data = await res2.json()
            if (data.length > 0) {
                setSubmissionStatus(data[0].status)
            }
        } catch (error) {
            console.error("Failed to check submission", error)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            let fileUrl = null
            if (file) {
                const formData = new FormData()
                formData.append("file", file)
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
                if (!uploadRes.ok) throw new Error("Upload failed")
                const uploadData = await uploadRes.json()
                fileUrl = uploadData.url
            }

            const res = await fetch("/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assignmentId: params.id,
                    files: fileUrl ? [fileUrl] : [],
                    answerText: answerText || undefined
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Submission failed")
            }

            setSubmissionStatus("SUBMITTED")
            alert("Assignment submitted successfully!")
            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) return <p>Loading...</p>
    if (!assignment) return <p>Assignment not found</p>

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/dashboard/member/assignments">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Assignment Details</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{assignment.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                        <span>{assignment.domain.name}</span>
                        <span>•</span>
                        <span>{assignment.pointsBase} Points</span>
                        <span>•</span>
                        <span>Due: {assignment.dueDate ? format(new Date(assignment.dueDate), "PPP p") : "No Due Date"}</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="prose max-w-none">
                        <h3 className="text-lg font-medium">Instructions</h3>
                        <p className="text-gray-600 whitespace-pre-wrap">{assignment.description || "No description provided."}</p>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium mb-4">Your Submission</h3>

                        {submissionStatus ? (
                            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center text-green-700">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                <div>
                                    <p className="font-medium">Submitted</p>
                                    <p className="text-sm">Status: {submissionStatus}</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {assignment.submissionType === "FILE" ? (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Upload File</label>
                                        <div className="flex items-center justify-center w-full">
                                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                                                    <p className="text-xs text-gray-500">{file ? file.name : "PDF, DOCX, ZIP, etc."}</p>
                                                </div>
                                                <input id="dropzone-file" type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 p-4 rounded-md text-yellow-800 text-sm">
                                        This assignment requires in-person submission. Please contact your lead.
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Comments / Notes (Optional)</label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={answerText}
                                        onChange={(e) => setAnswerText(e.target.value)}
                                        placeholder="Any additional notes..."
                                    />
                                </div>

                                <Button type="submit" isLoading={isSubmitting} disabled={assignment.submissionType === "IN_PERSON"}>
                                    Submit Assignment
                                </Button>
                            </form>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
