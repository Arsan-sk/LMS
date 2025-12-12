import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import bcrypt from "bcryptjs"

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
    username: z.string().min(3).optional(),
    newPassword: z.string().min(6).optional(),
    currentPassword: z.string().optional(),
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

        // Check if sensitive fields are being changed
        const isSensitiveChange = data.username || data.newPassword

        if (isSensitiveChange) {
            // Require current password for sensitive changes
            if (!data.currentPassword) {
                return NextResponse.json(
                    { message: "Current password is required to change username or password" },
                    { status: 400 }
                )
            }

            // Fetch user with password hash
            const user = await db.user.findUnique({
                where: { id: session.user.id },
                select: { passwordHash: true }
            })

            if (!user) {
                return NextResponse.json({ message: "User not found" }, { status: 404 })
            }

            // Verify current password
            const isPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash)

            if (!isPasswordValid) {
                return NextResponse.json(
                    { message: "Password is incorrect" },
                    { status: 401 }
                )
            }
        }

        // Build update data
        const updateData: any = {
            phone: data.phone,
            year: data.year,
            department: data.department,
            bio: data.bio,
            profilePhoto: data.profilePhoto || null,
        }

        // Check if username is being changed
        if (data.username) {
            // Check if username is already taken by another user
            const existingUser = await db.user.findUnique({
                where: { username: data.username }
            })

            if (existingUser && existingUser.id !== session.user.id) {
                return NextResponse.json(
                    { message: "Username already taken" },
                    { status: 400 }
                )
            }

            updateData.username = data.username
        }

        // Hash new password if provided
        if (data.newPassword) {
            updateData.passwordHash = await bcrypt.hash(data.newPassword, 10)
        }

        // Update user
        const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: updateData,
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
