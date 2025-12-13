import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, FileText, BarChart, CheckSquare } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { ActiveMembersCard } from "@/components/ActiveMembersCard"

export default async function LeadDashboard() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    // If admin, they might not have a domainId in session if they are just viewing as admin, 
    // but this page is under /lead so we assume they are acting as lead.
    // However, admins can access lead routes. If admin has no domain, we might need to handle it.
    // For now, assume session.user.domainId is present or handle gracefully.

    // Actually, for ADMIN role, domainId might be null.
    // But if they are accessing /dashboard/lead, they should probably select a domain context?
    // Or maybe we just show stats for ALL domains if admin?
    // Let's stick to the user's assigned domain for now.

    const domainId = session.user.domainId

    if (!domainId && session.user.role !== "ADMIN") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-secondary-100 flex items-center justify-center">
                    <Users className="h-8 w-8 text-secondary-400" />
                </div>
                <h2 className="text-xl font-semibold text-neutral-graphite">No Domain Assigned</h2>
                <p className="text-secondary-500 max-w-md">
                    You are registered as a Lead, but you haven't been assigned to a domain yet.
                    Please contact an administrator to assign you to a domain.
                </p>
            </div>
        )
    }

    const whereDomain = domainId ? { domainId } : {}
    const whereDomainRelation = domainId ? { domainId } : {}

    // 1. Active Members
    const activeMembers = await db.user.findMany({
        where: {
            ...whereDomain,
            role: "MEMBER"
        },
        select: {
            id: true,
            username: true,
            email: true,
            department: true,
            year: true,
            createdAt: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    // Get domain name if domainId exists
    const domain = domainId ? await db.domain.findUnique({
        where: { id: domainId },
        select: { name: true }
    }) : null

    // 2. Pending Submissions
    const pendingSubmissions = await db.submission.count({
        where: {
            status: "SUBMITTED",
            OR: [
                { assignment: whereDomainRelation },
                { quiz: whereDomainRelation }
            ]
        }
    })

    // 3. Avg Quiz Score
    const avgScoreAggregation = await db.submission.aggregate({
        where: {
            status: "CHECKED",
            quiz: whereDomainRelation
        },
        _avg: {
            gradePoints: true
        }
    })
    const avgQuizScore = avgScoreAggregation._avg.gradePoints ? Math.round(avgScoreAggregation._avg.gradePoints) : 0

    // 4. Recent Submissions
    const recentSubmissions = await db.submission.findMany({
        where: {
            OR: [
                { assignment: whereDomainRelation },
                { quiz: whereDomainRelation }
            ]
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { username: true, email: true } },
            assignment: { select: { title: true } },
            quiz: { select: { title: true } }
        }
    })

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-graphite">Lead Dashboard</h1>
                    <p className="text-secondary-500 mt-1">Manage your domain and track progress.</p>
                </div>
                <div className="flex space-x-3">
                    <Link href="/dashboard/lead/assignments/create">
                        <Button className="shadow-glow">
                            <Plus className="mr-2 h-4 w-4" />
                            New Assignment
                        </Button>
                    </Link>
                    <Link href="/dashboard/lead/resources/create">
                        <Button variant="secondary">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Resource
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <ActiveMembersCard
                    count={activeMembers.length}
                    members={activeMembers}
                    domainName={domain?.name}
                />
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Pending Submissions</CardTitle>
                        <FileText className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-graphite">{pendingSubmissions}</div>
                        <p className="text-xs text-secondary-400 mt-1">Needs grading</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Avg. Quiz Score</CardTitle>
                        <BarChart className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-graphite">{avgQuizScore}</div>
                        <p className="text-xs text-secondary-400 mt-1">Points per quiz</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Completion Rate</CardTitle>
                        <CheckSquare className="h-4 w-4 text-info" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-graphite">--%</div>
                        <p className="text-xs text-secondary-400 mt-1">Overall progress</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Submissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentSubmissions.length === 0 ? (
                                <p className="text-sm text-secondary-500 text-center py-8">No submissions yet.</p>
                            ) : (
                                recentSubmissions.map((sub) => (
                                    <div key={sub.id} className="flex items-center justify-between rounded-xl border border-secondary-100 p-4 hover:bg-secondary-50 transition-colors group">
                                        <div className="flex items-center space-x-4">
                                            <div className="rounded-full bg-secondary-100 p-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                <Users className="h-5 w-5 text-secondary-500 group-hover:text-primary-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-neutral-graphite">{sub.user.username}</p>
                                                <p className="text-xs text-secondary-500">
                                                    Submitted {sub.assignment?.title || sub.quiz?.title}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${sub.status === 'CHECKED' ? 'bg-success/10 text-success' :
                                                sub.status === 'REJECTED' ? 'bg-error/10 text-error' :
                                                    'bg-warning/10 text-warning'
                                                }`}>
                                                {sub.status}
                                            </span>
                                            <Link href={`/dashboard/lead/submissions/${sub.id}`}>
                                                <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-600 hover:bg-primary-50">View</Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <Link href="/dashboard/lead/assignments/create" className="block">
                                <Button variant="outline" className="w-full justify-start h-12 text-secondary-600 hover:text-primary-600 hover:border-primary-200 group">
                                    <div className="h-8 w-8 rounded-lg bg-secondary-100 flex items-center justify-center mr-3 group-hover:bg-primary-50 transition-colors">
                                        <FileText className="h-4 w-4 text-secondary-500 group-hover:text-primary-500" />
                                    </div>
                                    Create Assignment
                                </Button>
                            </Link>
                            <Link href="/dashboard/lead/quizzes/create" className="block">
                                <Button variant="outline" className="w-full justify-start h-12 text-secondary-600 hover:text-primary-600 hover:border-primary-200 group">
                                    <div className="h-8 w-8 rounded-lg bg-secondary-100 flex items-center justify-center mr-3 group-hover:bg-primary-50 transition-colors">
                                        <CheckSquare className="h-4 w-4 text-secondary-500 group-hover:text-primary-500" />
                                    </div>
                                    Create Quiz
                                </Button>
                            </Link>
                            <Link href="/dashboard/lead/resources/create" className="block">
                                <Button variant="outline" className="w-full justify-start h-12 text-secondary-600 hover:text-primary-600 hover:border-primary-200 group">
                                    <div className="h-8 w-8 rounded-lg bg-secondary-100 flex items-center justify-center mr-3 group-hover:bg-primary-50 transition-colors">
                                        <Plus className="h-4 w-4 text-secondary-500 group-hover:text-primary-500" />
                                    </div>
                                    Upload Resource
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
