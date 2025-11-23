import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const leads = await db.user.findMany({
            where: { role: "LEAD" },
            select: {
                id: true,
                username: true,
                email: true,
                domainId: true,
            },
        })

        return NextResponse.json(leads)
    } catch (error) {
        console.error("[LEADS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
