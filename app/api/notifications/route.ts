import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const notifications = await db.notification.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 20
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error("Fetch notifications error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { id, markAllRead } = body

        if (markAllRead) {
            await db.notification.updateMany({
                where: {
                    userId: session.user.id,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            })
            return NextResponse.json({ message: "All marked as read" })
        }

        if (id) {
            await db.notification.update({
                where: {
                    id,
                    userId: session.user.id
                },
                data: {
                    isRead: true
                }
            })
            return NextResponse.json({ message: "Marked as read" })
        }

        return NextResponse.json({ message: "Invalid request" }, { status: 400 })
    } catch (error) {
        console.error("Update notification error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
