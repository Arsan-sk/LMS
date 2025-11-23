import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { userId } = body

        if (!userId) {
            return new NextResponse("User ID is required", { status: 400 })
        }

        // Check if user is a LEAD
        const user = await db.user.findUnique({
            where: { id: userId },
        })

        if (!user || user.role !== "LEAD") {
            return new NextResponse("User must be a LEAD", { status: 400 })
        }

        // Create DomainLead entry
        // Also update User's domainId for backward compatibility/simplicity if needed
        // But DomainLead is the source of truth for "leading" a domain.
        // However, the User model has `domainId`. If a user leads a domain, they should probably belong to it?
        // Or `domainId` on User means "assigned domain" (for members).
        // For Leads, `domainId` might be redundant if `DomainLead` exists, but let's keep them in sync if possible.

        // Enforce Single Domain per Lead: Remove from other domains
        await db.domainLead.deleteMany({
            where: { userId: userId }
        })

        const domainLead = await db.domainLead.create({
            data: {
                domainId: params.id,
                userId: userId,
            },
        })

        // Update user's domainId
        await db.user.update({
            where: { id: userId },
            data: { domainId: params.id }
        })

        return NextResponse.json(domainLead)
    } catch (error: any) {
        console.error("[DOMAIN_LEAD_ADD]", error)
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const userId = searchParams.get("userId")

        if (!userId) {
            return new NextResponse("User ID is required", { status: 400 })
        }

        await db.domainLead.deleteMany({
            where: {
                domainId: params.id,
                userId: userId,
            },
        })

        // Optional: Clear user's domainId if it matches?
        // Maybe not, as they might still be a member of it?
        // But for Leads, usually they are removed entirely from the domain responsibility.
        // Let's leave domainId alone or set to null?
        // Safest is to leave it, or set to null if we want to "unassign" them completely.
        // The user said "assign lead to domain or domain a lead".

        await db.user.update({
            where: { id: userId },
            data: { domainId: null }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[DOMAIN_LEAD_REMOVE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
