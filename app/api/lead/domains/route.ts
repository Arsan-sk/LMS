import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "LEAD") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const domainLeads = await db.domainLead.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                domain: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        })

        const domains = domainLeads.map(dl => dl.domain)

        return NextResponse.json(domains)
    } catch (error) {
        console.error("Fetch lead domains error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
