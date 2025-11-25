import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { QuestionType } from "@prisma/client"

const questionSchema = z.object({
    questionText: z.string().min(1),
    questionType: z.nativeEnum(QuestionType),
    options: z.array(z.string()).optional(),
    correctAnswer: z.any().optional(),
    points: z.number().int().min(1),
})

const createQuizSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    domainId: z.string().min(1),
    published: z.boolean().default(false),
    questions: z.array(questionSchema),
})

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.role !== "LEAD" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { title, description, domainId, published, questions } = createQuizSchema.parse(body)

        // Verify lead has access to domain
        if (session.user.role === "LEAD") {
            const hasAccess = await db.domainLead.findUnique({
                where: {
                    userId_domainId: {
                        userId: session.user.id,
                        domainId,
                    }
                }
            })

            if (!hasAccess) {
                return NextResponse.json({ message: "You do not have access to this domain" }, { status: 403 })
            }
        }

        const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

        const quiz = await db.quiz.create({
            data: {
                title,
                description,
                domainId,
                published,
                totalPoints,
                createdBy: session.user.id,
                questions: {
                    create: questions.map(q => ({
                        questionText: q.questionText,
                        questionType: q.questionType,
                        options: q.options ? JSON.stringify(q.options) : undefined,
                        correctAnswer: q.correctAnswer ? JSON.stringify(q.correctAnswer) : undefined,
                        points: q.points,
                    }))
                }
            },
            include: {
                questions: true
            }
        })

        if (published) {
            const domainUsers = await db.user.findMany({
                where: { domainId: domainId }
            })

            if (domainUsers.length > 0) {
                await db.notification.createMany({
                    data: domainUsers.map(user => ({
                        userId: user.id,
                        title: "New Quiz Published",
                        body: `A new quiz "${title}" has been published in your domain.`,
                        type: "ALERT",
                        isRead: false
                    }))
                })
            }
        }

        return NextResponse.json(quiz, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 })
        }
        console.error("Create quiz error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const { searchParams } = new URL(req.url)
        const domainId = searchParams.get("domainId")
        const id = searchParams.get("id")

        const where: any = {}

        if (id) {
            const quiz = await db.quiz.findUnique({
                where: { id },
                include: {
                    domain: {
                        select: { name: true }
                    },
                    creator: {
                        select: { username: true }
                    },
                    questions: true
                }
            })

            // Enforce domain check for members
            if (quiz && session?.user?.role === "MEMBER" && session?.user?.domainId && quiz.domainId !== session.user.domainId) {
                return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
            }

            return NextResponse.json(quiz)
        }

        if (session?.user?.role === "MEMBER" && session?.user?.domainId) {
            where.domainId = session.user.domainId
        } else if (domainId) {
            where.domainId = domainId
        }

        const quizzes = await db.quiz.findMany({
            where,
            include: {
                domain: {
                    select: {
                        name: true,
                    }
                },
                creator: {
                    select: {
                        username: true
                    }
                },
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: {
                createdAt: "desc",
            }
        })

        return NextResponse.json(quizzes)
    } catch (error) {
        console.error("Fetch quizzes error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.role !== "LEAD" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ message: "Quiz ID is required" }, { status: 400 })
        }

        const quiz = await db.quiz.findUnique({
            where: { id },
            include: { domain: true }
        })

        if (!quiz) {
            return NextResponse.json({ message: "Quiz not found" }, { status: 404 })
        }

        if (session.user.role === "LEAD") {
            const isLeadForDomain = await db.domainLead.findUnique({
                where: {
                    userId_domainId: {
                        userId: session.user.id,
                        domainId: quiz.domainId
                    }
                }
            })

            if (!isLeadForDomain) {
                return NextResponse.json({ message: "You do not have permission to delete this quiz" }, { status: 403 })
            }
        }

        // Delete questions first (cascade should handle this, but being safe)
        await db.question.deleteMany({
            where: { quizId: id }
        })

        await db.quiz.delete({
            where: { id }
        })

        return NextResponse.json({ message: "Quiz deleted successfully" })
    } catch (error) {
        console.error("Delete quiz error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.role !== "LEAD" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { id, ...data } = body

        if (!id) {
            return NextResponse.json({ message: "Quiz ID is required" }, { status: 400 })
        }

        const { title, description, domainId, published, questions } = createQuizSchema.parse(data)

        const existingQuiz = await db.quiz.findUnique({
            where: { id }
        })

        if (!existingQuiz) {
            return NextResponse.json({ message: "Quiz not found" }, { status: 404 })
        }

        // Verify lead has access to domain
        if (session.user.role === "LEAD") {
            const hasAccess = await db.domainLead.findUnique({
                where: {
                    userId_domainId: {
                        userId: session.user.id,
                        domainId: existingQuiz.domainId,
                    }
                }
            })

            if (!hasAccess) {
                return NextResponse.json({ message: "You do not have permission to edit this quiz" }, { status: 403 })
            }
        }

        const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

        // Transaction to update quiz and replace questions
        const updatedQuiz = await db.$transaction(async (tx) => {
            // Delete existing questions
            await tx.question.deleteMany({
                where: { quizId: id }
            })

            // Update quiz details
            const updatedQuiz = await tx.quiz.update({
                where: { id },
                data: {
                    title,
                    description,
                    domainId,
                    published,
                    totalPoints,
                    questions: {
                        create: questions.map(q => ({
                            questionText: q.questionText,
                            questionType: q.questionType,
                            options: q.options ? JSON.stringify(q.options) : undefined,
                            correctAnswer: q.correctAnswer ? JSON.stringify(q.correctAnswer) : undefined,
                            points: q.points,
                        }))
                    }
                },
                include: {
                    questions: true
                }
            })

            if (published && !existingQuiz!.published) {
                const domainUsers = await tx.user.findMany({
                    where: { domainId: domainId }
                })

                if (domainUsers.length > 0) {
                    await tx.notification.createMany({
                        data: domainUsers.map(user => ({
                            userId: user.id,
                            title: "New Quiz Published",
                            body: `A new quiz "${title}" has been published in your domain.`,
                            type: "ALERT",
                            isRead: false
                        }))
                    })
                }
            }

            return updatedQuiz
        })

        return NextResponse.json(updatedQuiz)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 })
        }
        console.error("Update quiz error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
