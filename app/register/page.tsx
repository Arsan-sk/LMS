"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    phone: z.string().optional(),
    year: z.string().optional(),
    department: z.string().optional(),
    domainId: z.string().min(1, "Please select a domain"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [domains, setDomains] = useState<{ id: string; name: string }[]>([])

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    })

    useEffect(() => {
        fetch("/api/domains")
            .then((res) => res.json())
            .then((data) => setDomains(data))
            .catch((err) => console.error("Failed to load domains", err))
    }, [])

    async function onSubmit(data: RegisterFormValues) {
        setIsLoading(true)
        setError("")

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const result = await res.json()
                throw new Error(result.message || "Registration failed")
            }

            router.push("/login")
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message)
            } else {
                setError("Something went wrong")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
            <Card className="w-full max-w-2xl shadow-glow border-none">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight text-neutral-graphite">Create an account</CardTitle>
                    <CardDescription className="text-secondary-500">
                        Enter your details to register as a member
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <Input
                                {...register("username")}
                                label="Username"
                                placeholder="johndoe"
                                error={errors.username?.message}
                                className="bg-secondary-50 border-transparent focus:bg-white transition-all"
                            />
                            <Input
                                {...register("email")}
                                label="Email"
                                type="email"
                                placeholder="john@example.com"
                                error={errors.email?.message}
                                className="bg-secondary-50 border-transparent focus:bg-white transition-all"
                            />
                            <Input
                                {...register("password")}
                                label="Password"
                                type="password"
                                error={errors.password?.message}
                                className="bg-secondary-50 border-transparent focus:bg-white transition-all"
                            />
                            <Input
                                {...register("confirmPassword")}
                                label="Confirm Password"
                                type="password"
                                error={errors.confirmPassword?.message}
                                className="bg-secondary-50 border-transparent focus:bg-white transition-all"
                            />
                            <Input
                                {...register("phone")}
                                label="Phone (Optional)"
                                placeholder="1234567890"
                                error={errors.phone?.message}
                                className="bg-secondary-50 border-transparent focus:bg-white transition-all"
                            />
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-graphite">Year</label>
                                <select
                                    {...register("year")}
                                    className="flex h-11 w-full rounded-xl border-transparent bg-secondary-50 px-3 py-2 text-sm text-neutral-graphite focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                                >
                                    <option value="">Select Year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-graphite">Department</label>
                                <select
                                    {...register("department")}
                                    className="flex h-11 w-full rounded-xl border-transparent bg-secondary-50 px-3 py-2 text-sm text-neutral-graphite focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                                >
                                    <option value="">Select Department</option>
                                    <option value="ECS">ECS</option>
                                    <option value="AIML">AIML</option>
                                    <option value="DS">DS</option>
                                    <option value="CO">CO</option>
                                    <option value="ME">ME</option>
                                    <option value="CE">CE</option>
                                    <option value="EE">EE</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-graphite">Domain</label>
                                <select
                                    {...register("domainId")}
                                    className="flex h-11 w-full rounded-xl border-transparent bg-secondary-50 px-3 py-2 text-sm text-neutral-graphite focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                                >
                                    <option value="">Select Domain</option>
                                    {domains.map((domain) => (
                                        <option key={domain.id} value={domain.id}>
                                            {domain.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.domainId && <p className="mt-1 text-sm text-error">{errors.domainId.message}</p>}
                            </div>
                        </div>

                        {error && <p className="text-sm text-error text-center">{error}</p>}

                        <Button className="w-full h-12 text-lg shadow-lg shadow-primary-500/20" type="submit" isLoading={isLoading}>
                            Register
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-secondary-500 pb-8">
                    <p>
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-primary-500 hover:text-primary-600 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
