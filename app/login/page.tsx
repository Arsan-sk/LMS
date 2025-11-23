"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const username = formData.get("username") as string
        const password = formData.get("password") as string

        try {
            const result = await signIn("credentials", {
                username,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError("Invalid username or password")
            } else {
                // Fetch session to get role
                const response = await fetch("/api/auth/session")
                const session = await response.json()

                if (session?.user?.role === "ADMIN") {
                    router.push("/admin")
                } else if (session?.user?.role === "LEAD") {
                    router.push("/dashboard/lead")
                } else {
                    router.push("/dashboard/member")
                }
                router.refresh()
            }
        } catch (error) {
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
            <Card className="w-full max-w-md shadow-glow border-none">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight text-neutral-graphite">Welcome Back</CardTitle>
                    <CardDescription className="text-secondary-500">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                name="username"
                                placeholder="Username"
                                label="Username"
                                required
                                autoComplete="username"
                                className="bg-secondary-50 border-transparent focus:bg-white transition-all"
                            />
                            <Input
                                name="password"
                                type="password"
                                placeholder="Password"
                                label="Password"
                                required
                                autoComplete="current-password"
                                className="bg-secondary-50 border-transparent focus:bg-white transition-all"
                            />
                        </div>
                        {error && <p className="text-sm text-error text-center">{error}</p>}
                        <Button className="w-full h-12 text-lg shadow-lg shadow-primary-500/20" type="submit" isLoading={isLoading}>
                            Sign In
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-secondary-500 pb-8">
                    <p>
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="font-semibold text-primary-500 hover:text-primary-600 transition-colors ">
                            Register here
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
