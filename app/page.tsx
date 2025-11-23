import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    if (session.user.role === "ADMIN") {
      redirect("/admin")
    } else if (session.user.role === "LEAD") {
      redirect("/dashboard/lead")
    } else {
      redirect("/dashboard/member")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-secondary-50 to-white text-center animate-fade-in">
      <div className="max-w-4xl px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-200/20 rounded-full blur-3xl -z-10"></div>

        <h1 className="text-5xl font-bold tracking-tight text-neutral-graphite sm:text-7xl mb-6">
          Elite Club <span className="text-primary-500">LMS</span>
        </h1>
        <p className="mt-6 text-xl leading-8 text-secondary-500 max-w-2xl mx-auto">
          Empowering students with resources, assignments, and quizzes across AIML, Cyber Security, and Web Development domains.
        </p>
        <div className="mt-12 flex items-center justify-center gap-x-6">
          <Link href="/login">
            <Button size="lg" className="h-14 px-8 text-lg shadow-lg shadow-primary-500/20 hover:scale-105 transition-transform">
              Get Started
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-secondary-200 text-secondary-600 hover:bg-secondary-50 hover:text-primary-600">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
