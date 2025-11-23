import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { SubmissionType } from "@prisma/client"

const createAssignmentSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    domainId: z.string().min(1),
    pointsBase: z.number().int().min(0),
    timelyBonusPoints: z.number().int().min(0).default(0),
    submissionType: z.nativeEnum(SubmissionType),
    published: z.boolean().default(false),
})

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.role !== "LEAD" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { title, description, dueDate, domainId, pointsBase, timelyBonusPoints, submissionType, published } = createAssignmentSchema.parse(body)

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

        const assignment = await db.assignment.create({
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                domainId,
                pointsBase,
                timelyBonusPoints,
                submissionType,
                published,
                createdBy: session.user.id,
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
                        title: "New Assignment Posted",
                        body: `A new assignment "${title}" has been posted in your domain.`,
                        type: "ALERT",
                        isRead: false
                    }))
                })
            }
        }

        return NextResponse.json(assignment, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 })
        }
        console.error("Create assignment error:", error)
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
        const domainId = searchParams.get("domainId")

        const where: any = {}

        // Enforce visibility
        if (session.user.role === "MEMBER") {
            if (!session.user.domainId) {
                return NextResponse.json([], { status: 200 }) // No domain assigned
            }
            where.domainId = session.user.domainId
        } else if (session.user.role === "LEAD") {
            // Leads can see assignments for domains they lead
            if (domainId) {
                // Verify access
                const hasAccess = await db.domainLead.findUnique({
                    where: {
                        userId_domainId: {
                            userId: session.user.id,
                            domainId,
                        }
                    }
                })
                if (!hasAccess) {
                    return NextResponse.json({ message: "Unauthorized for this domain" }, { status: 403 })
                }
                where.domainId = domainId
            } else {
                // If no domainId specified, show all assignments from domains they lead
                const ledDomains = await db.domainLead.findMany({
                    where: { userId: session.user.id },
                    select: { domainId: true }
                })
                where.domainId = { in: ledDomains.map(ld => ld.domainId) }
            }
        } else if (session.user.role === "ADMIN") {
            if (domainId) {
                where.domainId = domainId
            }
        }

        const assignments = await db.assignment.findMany({
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
                }
            },
            orderBy: {
                dueDate: "asc",
            }
        })

        return NextResponse.json(assignments)
    } catch (error) {
        console.error("Fetch assignments error:", error)
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
            return NextResponse.json({ message: "Assignment ID is required" }, { status: 400 })
        }

        const assignment = await db.assignment.findUnique({
            where: { id },
            include: { domain: true }
        })

        if (!assignment) {
            return NextResponse.json({ message: "Assignment not found" }, { status: 404 })
        }

        if (session.user.role === "LEAD") {
            const isLeadForDomain = await db.domainLead.findUnique({
                where: {
                    userId_domainId: {
                        userId: session.user.id,
                        domainId: assignment.domainId
                    }
                }
            })

            if (!isLeadForDomain) {
                return NextResponse.json({ message: "You do not have permission to delete this assignment" }, { status: 403 })
            }
        }

        await db.assignment.delete({
            where: { id }
        })

        return NextResponse.json({ message: "Assignment deleted successfully" })
    } catch (error) {
        console.error("Delete assignment error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
