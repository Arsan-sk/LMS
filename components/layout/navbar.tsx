"use client"

import { Bell, Search, Menu } from "lucide-react"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface NavbarProps {
    onMenuClick?: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
    const { data: session } = useSession()

    return (
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-white/80 px-8 backdrop-blur-md transition-all shadow-soft mb-6 rounded-b-2xl mx-4 mt-2">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={onMenuClick}>
                    <Menu className="h-6 w-6 text-secondary-600" />
                </Button>
                <div className="relative hidden sm:block group">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-secondary-400 group-hover:text-primary-400 transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="pl-10 w-64 bg-secondary-50 border-transparent focus:bg-white focus:border-primary-200 focus:ring-2 focus:ring-primary-100 transition-all rounded-xl"
                    />
                </div>
            </div>
            <div className="flex items-center space-x-6">
                <NotificationsDropdown />
                <Link href="/dashboard/profile" className="flex items-center space-x-3 pl-4 hover:bg-secondary-50 p-2 rounded-xl transition-all group hover:-translate-y-0.5">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-semibold text-neutral-graphite group-hover:text-primary-600 transition-colors">{session?.user?.username}</span>
                        <span className="text-xs text-secondary-500 font-medium px-2 py-0.5 rounded-full bg-secondary-100 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors mt-0.5">
                            {session?.user?.role}
                        </span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold border-2 border-white shadow-sm group-hover:shadow-md transition-all">
                        {session?.user?.username?.[0]?.toUpperCase()}
                    </div>
                </Link>
            </div>
        </header>
    )
}
