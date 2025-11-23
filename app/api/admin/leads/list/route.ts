import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const leads = await db.user.findMany({
            where: {
                role: "LEAD",
            },
            select: {
                id: true,
                username: true,
                email: true,
                ledDomains: {
                    select: {
                        domain: {
                            select: {
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            }
        })

        return NextResponse.json(leads)
    } catch (error) {
        console.error("Fetch leads error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
