import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
    year: z.string().optional(),
    department: z.string().optional(),
    domainId: z.string().min(1, "Domain is required"),
    role: z.enum(["MEMBER", "LEAD", "ADMIN"]).optional(),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { username, email, password, phone, year, department, domainId, role } = registerSchema.parse(body)

        // Check if requester is admin to allow setting role
        const session = await getServerSession(authOptions)
        const isAdmin = session?.user?.role === "ADMIN"

        // If not admin, force role to MEMBER
        const assignedRole = isAdmin && role ? role : "MEMBER"

        const existingUser = await db.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        })

        if (existingUser) {
            return NextResponse.json(
                { message: "User with this email or username already exists" },
                { status: 409 }
            )
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const user = await db.user.create({
            data: {
                username,
                email,
                passwordHash,
                phone,
                year,
                department,
                domainId,
                role: assignedRole,
            }
        })

        // If role is LEAD, create DomainLead entry
        if (assignedRole === "LEAD" && domainId) {
            await db.domainLead.create({
                data: {
                    userId: user.id,
                    domainId: domainId
                }
            })
        }

        // Remove password from response
        const { passwordHash: _, ...userWithoutPassword } = user

        return NextResponse.json(
            { message: "User created successfully", user: userWithoutPassword },
            { status: 201 }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 })
        }
        console.error("Registration error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
