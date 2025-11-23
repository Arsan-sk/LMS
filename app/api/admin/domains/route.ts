import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const createDomainSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
})

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, description } = createDomainSchema.parse(body)

        const existingDomain = await db.domain.findUnique({
            where: { name }
        })

        if (existingDomain) {
            return NextResponse.json(
                { message: "Domain with this name already exists" },
                { status: 409 }
            )
        }

        const domain = await db.domain.create({
            data: {
                name,
                description,
            }
        })

        return NextResponse.json(domain, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 })
        }
        console.error("Create domain error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
