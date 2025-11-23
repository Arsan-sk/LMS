import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Prevent deleting self
        if (session.user.id === params.id) {
            return new NextResponse("Cannot delete yourself", { status: 400 })
        }

        await db.user.delete({
            where: { id: params.id },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        console.error("[USER_DELETE]", error)
        return new NextResponse(error.message || "Internal Error", { status: 500 })
    }
}
