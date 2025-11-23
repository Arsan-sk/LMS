import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const createLeadSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    domainIds: z.array(z.string()).min(1),
})

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { username, email, password, domainIds } = createLeadSchema.parse(body)

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

        // Transaction to create user and assign domains
        const user = await db.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    username,
                    email,
                    passwordHash,
                    role: "LEAD",
                    bio: "Domain Lead",
                }
            })

            await tx.domainLead.createMany({
                data: domainIds.map((domainId) => ({
                    userId: newUser.id,
                    domainId,
                }))
            })

            return newUser
        })

        return NextResponse.json(
            { message: "Lead created successfully", userId: user.id },
            { status: 201 }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 })
        }
        console.error("Create lead error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
