"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const createLeadSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    domainIds: z.array(z.string()).min(1, "Select at least one domain"),
})

type CreateLeadFormValues = z.infer<typeof createLeadSchema>

export default function CreateLeadPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [domains, setDomains] = useState<{ id: string; name: string }[]>([])

    const { register, handleSubmit, formState: { errors } } = useForm<CreateLeadFormValues>({
        resolver: zodResolver(createLeadSchema),
    })

    useEffect(() => {
        fetch("/api/domains")
            .then((res) => res.json())
            .then((data) => setDomains(data))
            .catch((err) => console.error("Failed to load domains", err))
    }, [])

    async function onSubmit(data: CreateLeadFormValues) {
        setIsLoading(true)
        setError("")

        try {
            const res = await fetch("/api/admin/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const result = await res.json()
                throw new Error(result.message || "Failed to create lead")
            }

            router.push("/admin")
            router.refresh()
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
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Create Domain Lead</CardTitle>
                    <CardDescription>
                        Add a new lead and assign them to domains.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            {...register("username")}
                            label="Username"
                            placeholder="lead_username"
                            error={errors.username?.message}
                        />
                        <Input
                            {...register("email")}
                            label="Email"
                            type="email"
                            placeholder="lead@example.com"
                            error={errors.email?.message}
                        />
                        <Input
                            {...register("password")}
                            label="Password"
                            type="password"
                            error={errors.password?.message}
                        />

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-900">Assign Domains</label>
                            <div className="space-y-2">
                                {domains.map((domain) => (
                                    <div key={domain.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            value={domain.id}
                                            {...register("domainIds")}
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                                        />
                                        <label className="ml-2 text-sm text-gray-900">{domain.name}</label>
                                    </div>
                                ))}
                            </div>
                            {errors.domainIds && <p className="mt-1 text-sm text-red-600">{errors.domainIds.message}</p>}
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isLoading}>
                                Create Lead
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
