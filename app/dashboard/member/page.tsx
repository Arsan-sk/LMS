import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { BookOpen, Clock, Trophy, CheckCircle, FileText, Link as LinkIcon, Image as ImageIcon, Video } from "lucide-react"
import { redirect } from "next/navigation"

export default async function MemberDashboard() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    const domainId = session.user.domainId

    if (!domainId) {
        return <div>Please join a domain first.</div>
    }

    // 1. Total Points
    const pointsAggregation = await db.pointsEntry.aggregate({
        where: { userId: session.user.id },
        _sum: { points: true }
    })
    const totalPoints = pointsAggregation._sum.points || 0

    // 2. Assignments Due (Not submitted and due date in future)
    const assignmentsDue = await db.assignment.count({
        where: {
            domainId,
            dueDate: { gt: new Date() },
            submissions: {
                none: {
                    userId: session.user.id
                }
            }
        }
    })

    // 3. Completed (Assignments + Quizzes submitted)
    const completedCount = await db.submission.count({
        where: {
            userId: session.user.id,
            status: { in: ["SUBMITTED", "CHECKED"] }
        }
    })

    // 4. Recent Resources
    const recentResources = await db.resource.findMany({
        where: { domainId },
        take: 3,
        orderBy: { createdAt: "desc" }
    })

    // 5. Upcoming Deadlines
    const upcomingDeadlines = await db.assignment.findMany({
        where: {
            domainId,
            dueDate: { gt: new Date() },
            submissions: {
                none: {
                    userId: session.user.id
                }
            }
        },
        take: 3,
        orderBy: { dueDate: "asc" }
    })

    const getResourceIcon = (type: string) => {
        switch (type) {
            case "PDF": return <FileText className="h-4 w-4 text-red-600" />
            case "VIDEO": return <Video className="h-4 w-4 text-blue-600" />
            case "IMAGE": return <ImageIcon className="h-4 w-4 text-purple-600" />
            default: return <LinkIcon className="h-4 w-4 text-gray-600" />
        }
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-graphite">
                    Welcome back, {session.user.username}!
                </h1>
                <p className="text-secondary-500 mt-1">Here's what's happening in your domain.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Total Points</CardTitle>
                        <Trophy className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-graphite">{totalPoints}</div>
                        <p className="text-xs text-secondary-400 mt-1">Keep earning!</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Assignments Due</CardTitle>
                        <Clock className="h-4 w-4 text-error" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-graphite">{assignmentsDue}</div>
                        <p className="text-xs text-secondary-400 mt-1">Pending tasks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Completed Tasks</CardTitle>
                        <CheckCircle className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-graphite">{completedCount}</div>
                        <p className="text-xs text-secondary-400 mt-1">Submissions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Resources</CardTitle>
                        <BookOpen className="h-4 w-4 text-info" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-graphite">{recentResources.length}</div>
                        <p className="text-xs text-secondary-400 mt-1">New this week</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Resources</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentResources.length === 0 ? (
                                <p className="text-sm text-secondary-500 text-center py-8">No resources yet.</p>
                            ) : (
                                recentResources.map((resource) => (
                                    <div key={resource.id} className="flex items-center justify-between rounded-xl border border-secondary-100 p-4 hover:bg-secondary-50 transition-colors group">
                                        <div className="flex items-center space-x-4">
                                            <div className="rounded-full bg-secondary-100 p-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                {getResourceIcon(resource.type)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-neutral-graphite">{resource.title}</p>
                                                <p className="text-xs text-secondary-500">Uploaded {new Date(resource.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-secondary-500 bg-secondary-100 px-2 py-1 rounded-full">{resource.type}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Upcoming Deadlines</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {upcomingDeadlines.length === 0 ? (
                                <p className="text-sm text-secondary-500 text-center py-8">No upcoming deadlines.</p>
                            ) : (
                                upcomingDeadlines.map((assignment) => (
                                    <div key={assignment.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-secondary-50 transition-colors">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-semibold text-neutral-graphite leading-none">{assignment.title}</p>
                                            <p className="text-xs text-secondary-500">Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}</p>
                                        </div>
                                        <div className="rounded-full bg-error/10 px-2.5 py-1 text-xs font-medium text-error">
                                            Due Soon
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
