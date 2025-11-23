import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const path = req.nextUrl.pathname

        if (path.startsWith("/admin") && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard/member", req.url))
        }

        if (path.startsWith("/dashboard/lead") && token?.role !== "LEAD" && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard/member", req.url))
        }

        if (path.startsWith("/dashboard/member") && !token) {
            return NextResponse.redirect(new URL("/login", req.url))
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
)

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/resources/:path*", "/leaderboard/:path*"],
}
