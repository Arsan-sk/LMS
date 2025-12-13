import { db } from "@/lib/db"
import { CreateLeadModal } from "@/components/create-lead-modal"
import { UserActions } from "@/components/user-actions"
import { UserFilters } from "@/components/user-filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"

export default async function AdminUsersPage(props: { searchParams: Promise<{ role?: string }> }) {
    const searchParams = await props.searchParams
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
        redirect("/login")
    }

    const roleFilter = searchParams.role ? (searchParams.role as Role) : undefined

    const users = await db.user.findMany({
        where: roleFilter ? { role: roleFilter } : undefined,
        include: {
            domain: true,
            ledDomains: {
                include: {
                    domain: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    const domains = await db.domain.findMany({
        select: { id: true, name: true }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-graphite">User Management</h1>
                    <p className="text-secondary-500">Manage users, leads, and admins.</p>
                </div>
                <CreateLeadModal domains={domains} />
            </div>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 space-y-0">
                    <CardTitle>All Users</CardTitle>
                    <UserFilters />
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-secondary-500 uppercase bg-secondary-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap">Username</th>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap">Email</th>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap">Role</th>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap">Domain</th>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap">Joined</th>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="bg-white border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-neutral-graphite whitespace-nowrap">
                                            {user.username}
                                        </td>
                                        <td className="px-6 py-4 text-secondary-600 whitespace-nowrap">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-primary-100 text-primary-700' :
                                                user.role === 'LEAD' ? 'bg-warning/10 text-warning' :
                                                    'bg-secondary-100 text-secondary-600'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-secondary-600 whitespace-nowrap">
                                            {user.role === 'LEAD' && user.ledDomains.length > 0
                                                ? user.ledDomains.map(ld => ld.domain.name).join(", ")
                                                : user.domain?.name || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-secondary-500 whitespace-nowrap">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <UserActions userId={user.id} username={user.username} />
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-secondary-500">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
