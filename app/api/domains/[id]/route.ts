import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { description, maxCapacity } = body

        const domain = await db.domain.update({
            where: { id: params.id },
            data: {
                description,
                maxCapacity: parseInt(maxCapacity),
            },
        })

        return NextResponse.json(domain)
    } catch (error) {
        console.error("[DOMAIN_UPDATE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
