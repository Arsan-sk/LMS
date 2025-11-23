import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                phone: true,
                year: true,
                department: true,
                bio: true,
                profilePhoto: true,
                domain: {
                    select: { name: true }
                },
                createdAt: true
            }
        })

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("Fetch profile error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}

const updateProfileSchema = z.object({
    phone: z.string().optional(),
    year: z.string().optional(),
    department: z.string().optional(),
    bio: z.string().optional(),
    profilePhoto: z.string().url().optional().or(z.literal("")),
})

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const data = updateProfileSchema.parse(body)

        const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: {
                phone: data.phone,
                year: data.year,
                department: data.department,
                bio: data.bio,
                profilePhoto: data.profilePhoto || null,
            },
            select: {
                id: true,
                username: true,
                email: true,
                phone: true,
                year: true,
                department: true,
                bio: true,
                profilePhoto: true,
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 })
        }
        console.error("Update profile error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
