"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, User } from "lucide-react"
import { useSession } from "next-auth/react"

interface LeaderboardUser {
    id: string
    username: string
    profilePhoto: string | null
    domainName: string
    totalPoints: number
    rank: number
}

export default function LeaderboardPage() {
    const { data: session } = useSession()
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    async function fetchLeaderboard() {
        try {
            const res = await fetch("/api/leaderboard")
            const data = await res.json()
            setLeaderboard(data)
        } catch (error) {
            console.error("Failed to fetch leaderboard", error)
        } finally {
            setIsLoading(false)
        }
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="h-6 w-6 text-yellow-500" />
            case 2: return <Medal className="h-6 w-6 text-gray-400" />
            case 3: return <Medal className="h-6 w-6 text-amber-600" />
            default: return <span className="text-lg font-bold text-gray-500 w-6 text-center">{rank}</span>
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Leaderboard</h1>
                <p className="text-gray-500">See who's leading the pack in Elite Club.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Loading leaderboard...</p>
                    ) : leaderboard.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No data available yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {leaderboard.map((user) => (
                                <div
                                    key={user.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border ${session?.user?.id === user.id
                                        ? "bg-primary-50 border-primary-200 ring-1 ring-primary-200"
                                        : "bg-white border-gray-100 hover:bg-gray-50"
                                        }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0 w-8 flex justify-center">
                                            {getRankIcon(user.rank)}
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                {user.profilePhoto ? (
                                                    <img src={user.profilePhoto} alt={user.username} className="h-full w-full object-cover" />
                                                ) : (
                                                    <User className="h-6 w-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className={`font-medium ${session?.user?.id === user.id ? "text-primary-900" : "text-gray-900"}`}>
                                                    {user.username} {session?.user?.id === user.id && "(You)"}
                                                </p>
                                                <p className="text-xs text-gray-500">{user.domainName}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-primary-600">{user.totalPoints}</p>
                                        <p className="text-xs text-gray-500">Points</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
