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

        const domains = await db.domain.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        leads: true,
                        resources: true,
                    }
                },
                leads: {
                    include: {
                        user: {
                            select: {
                                username: true,
                                email: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: "asc",
            }
        })

        return NextResponse.json(domains)
    } catch (error) {
        console.error("Fetch domains error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
