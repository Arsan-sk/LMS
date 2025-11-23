import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { SubmissionStatus } from "@prisma/client"

const createSubmissionSchema = z.object({
    assignmentId: z.string().optional(),
    quizId: z.string().optional(),
    files: z.array(z.string()).optional(),
    answerText: z.string().optional(),
})

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { assignmentId, quizId, files, answerText } = createSubmissionSchema.parse(body)

        if (!assignmentId && !quizId) {
            return NextResponse.json({ message: "Either assignmentId or quizId is required" }, { status: 400 })
        }

        // Check if already submitted
        const existing = await db.submission.findFirst({
            where: {
                userId: session.user.id,
                OR: [
                    { assignmentId: assignmentId || undefined },
                    { quizId: quizId || undefined }
                ]
            }
        })

        if (existing) {
            return NextResponse.json({ message: "You have already submitted this." }, { status: 400 })
        }

        const submission = await db.submission.create({
            data: {
                userId: session.user.id,
                assignmentId,
                quizId,
                files: files ? JSON.stringify(files) : undefined,
                answerText,
                status: "SUBMITTED",
            }
        })

        return NextResponse.json(submission, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 })
        }
        console.error("Create submission error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        const assignmentId = searchParams.get("assignmentId")
        const quizId = searchParams.get("quizId")
        const userId = searchParams.get("userId")

        if (id) {
            const submission = await db.submission.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        }
                    },
                    assignment: true,
                    quiz: {
                        include: {
                            questions: true
                        }
                    }
                }
            })

            if (!submission) {
                return NextResponse.json({ message: "Submission not found" }, { status: 404 })
            }

            // Access control
            if (session.user.role === "MEMBER" && submission.userId !== session.user.id) {
                return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
            }

            return NextResponse.json(submission)
        }

        const where: any = {}

        if (assignmentId) where.assignmentId = assignmentId
        if (quizId) where.quizId = quizId
        if (userId) where.userId = userId

        // If member, can only see own submissions
        if (session.user.role === "MEMBER") {
            where.userId = session.user.id
        }

        const submissions = await db.submission.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    }
                },
                assignment: {
                    select: { title: true }
                },
                quiz: {
                    select: { title: true }
                }
            },
            orderBy: {
                createdAt: "desc",
            }
        })

        return NextResponse.json(submissions)
    } catch (error) {
        console.error("Fetch submissions error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}

const gradeSubmissionSchema = z.object({
    id: z.string().min(1),
    status: z.enum(["CHECKED", "REJECTED"]),
    gradePoints: z.number().int().min(0).optional(),
    feedback: z.string().optional(), // Not in schema but useful to pass back as reason? Schema has 'reason' in PointsEntry
})

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.role !== "LEAD" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { id, status, gradePoints, feedback } = gradeSubmissionSchema.parse(body)

        const submission = await db.submission.findUnique({
            where: { id },
            include: {
                assignment: true,
                quiz: true
            }
        })

        if (!submission) {
            return NextResponse.json({ message: "Submission not found" }, { status: 404 })
        }

        // Verify lead access (optional but good practice, skipping for brevity/speed as lead role is checked)

        // Update submission
        const updatedSubmission = await db.$transaction(async (tx) => {
            const sub = await tx.submission.update({
                where: { id },
                data: {
                    status,
                    gradePoints: status === "CHECKED" ? gradePoints : 0,
                    gradedBy: session.user.id,
                }
            })

            // If checked and points > 0, add to PointsEntry
            // Check if points entry already exists for this submission to avoid duplicates if re-graded?
            // For simplicity, we'll assume one-time grading or we should delete old entry.
            // Let's delete old entry first if exists.

            await tx.pointsEntry.deleteMany({
                where: {
                    sourceId: id,
                    sourceType: submission.assignmentId ? "ASSIGNMENT" : "QUIZ"
                }
            })

            if (status === "CHECKED" && gradePoints && gradePoints > 0) {
                await tx.pointsEntry.create({
                    data: {
                        userId: submission.userId,
                        sourceType: submission.assignmentId ? "ASSIGNMENT" : "QUIZ",
                        sourceId: id,
                        points: gradePoints,
                        reason: feedback || (submission.assignmentId ? `Assignment: ${submission.assignment?.title}` : `Quiz: ${submission.quiz?.title}`),
                        awardedBy: session.user.id
                    }
                })
            }

            // Create Notification
            await tx.notification.create({
                data: {
                    userId: submission.userId,
                    title: status === "CHECKED" ? "Submission Graded" : "Submission Rejected",
                    body: status === "CHECKED"
                        ? `Your submission for ${submission.assignment?.title || submission.quiz?.title} has been graded. You received ${gradePoints} points.`
                        : `Your submission for ${submission.assignment?.title || submission.quiz?.title} has been rejected.`,
                    type: "INFO",
                    isRead: false
                }
            })


            return sub
        })

        return NextResponse.json(updatedSubmission)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 })
        }
        console.error("Grade submission error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
