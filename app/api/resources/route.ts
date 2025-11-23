import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { ResourceType } from "@prisma/client"

const createResourceSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    type: z.nativeEnum(ResourceType),
    url: z.string().min(1),
    domainId: z.string().min(1),
})

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.role !== "LEAD" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { title, description, type, url, domainId } = createResourceSchema.parse(body)

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

        const resource = await db.resource.create({
            data: {
                title,
                description,
                type,
                url,
                domainId,
                uploadedBy: session.user.id,
            }
        })

        return NextResponse.json(resource, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 })
        }
        console.error("Create resource error:", error)
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
        const type = searchParams.get("type") as ResourceType | null
        const search = searchParams.get("q")

        const where: any = {}

        // Enforce visibility
        if (session.user.role === "MEMBER") {
            if (!session.user.domainId) {
                return NextResponse.json([], { status: 200 }) // No domain assigned, no resources
            }
            where.domainId = session.user.domainId
        } else if (session.user.role === "LEAD") {
            // Leads can see resources for domains they lead
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
                // If no domainId specified, show all resources from domains they lead
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

        if (type) {
            where.type = type
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ]
        }

        const resources = await db.resource.findMany({
            where,
            include: {
                uploader: {
                    select: {
                        username: true,
                    }
                },
                domain: {
                    select: {
                        name: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            }
        })

        return NextResponse.json(resources)
    } catch (error) {
        console.error("Fetch resources error:", error)
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
            return NextResponse.json({ message: "Resource ID is required" }, { status: 400 })
        }

        // Check if resource exists and user has permission
        const resource = await db.resource.findUnique({
            where: { id },
            include: { domain: true }
        })

        if (!resource) {
            return NextResponse.json({ message: "Resource not found" }, { status: 404 })
        }

        // Admins can delete anything. Leads can only delete resources for domains they manage.
        if (session.user.role === "LEAD") {
            const isLeadForDomain = await db.domainLead.findUnique({
                where: {
                    userId_domainId: {
                        userId: session.user.id,
                        domainId: resource.domainId
                    }
                }
            })

            if (!isLeadForDomain) {
                return NextResponse.json({ message: "You do not have permission to delete this resource" }, { status: 403 })
            }
        }

        await db.resource.delete({
            where: { id }
        })

        return NextResponse.json({ message: "Resource deleted successfully" })
    } catch (error) {
        console.error("Delete resource error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
