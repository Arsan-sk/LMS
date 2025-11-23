"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { QuizForm } from "@/components/quiz-form"

interface Domain {
    id: string
    name: string
}

export default function CreateQuizPage() {
    const [domains, setDomains] = useState<Domain[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchDomains()
    }, [])

    async function fetchDomains() {
        try {
            const res = await fetch("/api/lead/domains")
            const data = await res.json()
            setDomains(data)
        } catch (error) {
            console.error("Failed to fetch domains", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) return <p>Loading...</p>

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center space-x-4">
                <Link href="/dashboard/lead/quizzes">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create Quiz</h1>
            </div>

            <QuizForm domains={domains} />
        </div>
    )
}
