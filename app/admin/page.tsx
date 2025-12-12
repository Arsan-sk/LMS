import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Globe, Activity, Server } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { ActiveMembersCard } from "@/components/ActiveMembersCard"

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
        redirect("/login")
    }

    // 1. Total Users
    const totalUsers = await db.user.findMany({
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

    // 2. Active Domains
    const activeDomains = await db.domain.count()

    // 3. Recent Users
    const recentUsers = await db.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { domain: true }
    })

    // 4. Recent Domains
    const recentDomains = await db.domain.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { users: true } } }
    })

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-graphite">Admin Dashboard</h1>
                <p className="text-secondary-500 mt-1">System overview and management.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <ActiveMembersCard
                    count={totalUsers.length}
                    members={totalUsers}
                    domainName="All Domains"
                />
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Active Domains</CardTitle>
                        <Globe className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-graphite">{activeDomains}</div>
                        <p className="text-xs text-secondary-400 mt-1">Learning tracks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">System Status</CardTitle>
                        <Activity className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-success">Operational</div>
                        <p className="text-xs text-secondary-400 mt-1">All systems normal</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-secondary-500">Server Load</CardTitle>
                        <Server className="h-4 w-4 text-info" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-graphite">12%</div>
                        <p className="text-xs text-secondary-400 mt-1">CPU Usage</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between rounded-xl border border-secondary-100 p-4 hover:bg-secondary-50 transition-colors group">
                                    <div className="flex items-center space-x-4">
                                        <div className="rounded-full bg-secondary-100 p-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                                            <Users className="h-5 w-5 text-secondary-500 group-hover:text-primary-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-neutral-graphite">{user.username}</p>
                                            <p className="text-xs text-secondary-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium mb-1 inline-block ${user.role === 'ADMIN' ? 'bg-primary-100 text-primary-700' :
                                            user.role === 'LEAD' ? 'bg-teal-100 text-teal-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                        <p className="text-xs text-secondary-400">{user.domain?.name || "No Domain"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Domains Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentDomains.map((domain) => (
                                <div key={domain.id} className="flex items-center justify-between rounded-xl border border-secondary-100 p-4 hover:bg-secondary-50 transition-colors group">
                                    <div className="flex items-center space-x-4">
                                        <div className="rounded-full bg-secondary-100 p-2 group-hover:bg-white group-hover:shadow-sm transition-all">
                                            <Globe className="h-5 w-5 text-secondary-500 group-hover:text-success" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-neutral-graphite">{domain.name}</p>
                                            <p className="text-xs text-secondary-500">Created {new Date(domain.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-neutral-graphite">{domain._count.users}</p>
                                        <p className="text-xs text-secondary-400">Users</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
