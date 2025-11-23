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

        const { searchParams } = new URL(req.url)
        const domainId = searchParams.get("domainId")

        const where: any = {
            role: "MEMBER" // Only show members in leaderboard
        }

        if (domainId) {
            where.domainId = domainId
        }

        // Fetch users with their points
        // We can use aggregation or just fetch and calculate. 
        // Since Prisma doesn't support complex aggregation with relations easily in one go for sorting,
        // we might need to fetch users and their points sum.

        // Efficient way: GroupBy PointsEntry? 
        // But we need user details.

        // Let's fetch users and include pointsEntries sum.
        // Actually, Prisma can do this with `include` and then we process in JS, 
        // or use `groupBy` on PointsEntry and then fetch users.

        // Let's try fetching users with their points entries.
        // For scalability, we should probably have a cached `totalPoints` field on User, 
        // but for now, calculating on the fly is fine for smaller datasets.

        const users = await db.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                profilePhoto: true,
                domain: {
                    select: { name: true }
                },
                pointsEntries: {
                    select: {
                        points: true
                    }
                }
            }
        })

        const leaderboard = users.map(user => ({
            id: user.id,
            username: user.username,
            profilePhoto: user.profilePhoto,
            domainName: user.domain?.name || "N/A",
            totalPoints: user.pointsEntries.reduce((sum, entry) => sum + entry.points, 0)
        }))

        // Sort by total points descending
        leaderboard.sort((a, b) => b.totalPoints - a.totalPoints)

        // Add rank
        const rankedLeaderboard = leaderboard.map((user, index) => ({
            ...user,
            rank: index + 1
        }))

        return NextResponse.json(rankedLeaderboard)
    } catch (error) {
        console.error("Fetch leaderboard error:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
