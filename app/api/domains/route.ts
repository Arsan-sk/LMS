import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const domains = await db.domain.findMany({
            select: {
                id: true,
                name: true,
            }
        })
        return NextResponse.json(domains)
    } catch (error) {
        console.error("Failed to fetch domains:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
