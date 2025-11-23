"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Trophy,
    Settings,
    LogOut,
    Users,
    Globe,
    CheckSquare,
    PlusCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const role = session?.user?.role

    const memberLinks = [
        { href: "/dashboard/member", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/member/resources", label: "Resources", icon: BookOpen },
        { href: "/dashboard/member/assignments", label: "Assignments", icon: FileText },
        { href: "/dashboard/member/quizzes", label: "Quizzes", icon: CheckSquare },
        { href: "/dashboard/member/leaderboard", label: "Leaderboard", icon: Trophy },
    ]

    const leadLinks = [
        { href: "/dashboard/lead", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/lead/resources", label: "Resources", icon: BookOpen },
        { href: "/dashboard/lead/assignments", label: "Assignments", icon: FileText },
        { href: "/dashboard/lead/quizzes", label: "Quizzes", icon: CheckSquare },
        { href: "/dashboard/lead/submissions", label: "Submissions", icon: FileText },
    ]

    const adminLinks = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/domains", label: "Domains", icon: Globe },
    ]

    const links = role === "ADMIN" ? adminLinks : role === "LEAD" ? leadLinks : memberLinks

    return (
        <div className="flex h-full flex-col bg-white border-r border-secondary-200 shadow-soft">
            <div className="flex h-20 items-center px-8">
                <div className="h-8 w-8 rounded-lg bg-primary-400 flex items-center justify-center mr-3 shadow-glow">
                    <Trophy className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-neutral-graphite">ELITE CLUB</span>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href || pathname?.startsWith(link.href + "/")

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary-50 text-primary-600 shadow-sm translate-x-1"
                                    : "text-secondary-500 hover:bg-secondary-50 hover:text-primary-500 hover:translate-x-1"
                            )}
                        >
                            <Icon className={cn(
                                "mr-3 h-5 w-5 transition-colors",
                                isActive ? "text-primary-500" : "text-secondary-400 group-hover:text-primary-400"
                            )} />
                            {link.label}
                        </Link>
                    )
                })}
            </div>

            <div className="p-6 border-t border-secondary-100">
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center px-4 py-3 text-sm font-medium text-secondary-500 rounded-xl hover:bg-error/10 hover:text-error transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
