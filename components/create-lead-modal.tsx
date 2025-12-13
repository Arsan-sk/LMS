"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

// Simple Label component if not exists
function SimpleLabel({ children, htmlFor }: { children: React.ReactNode, htmlFor?: string }) {
    return <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-graphite">{children}</label>
}

export function CreateLeadModal({ domains }: { domains: { id: string, name: string }[] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const username = formData.get("username") as string
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const domainId = formData.get("domainId") as string
        const role = formData.get("role") as string

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    domainId,
                    role, // We need to update register API to allow role selection if admin
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Failed to create user")
            }

            setOpen(false)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                        Add a new user to the system. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <SimpleLabel htmlFor="username">Username</SimpleLabel>
                        <Input id="username" name="username" required />
                    </div>
                    <div className="space-y-2">
                        <SimpleLabel htmlFor="email">Email</SimpleLabel>
                        <Input id="email" name="email" type="email" required />
                    </div>
                    <div className="space-y-2">
                        <SimpleLabel htmlFor="password">Password</SimpleLabel>
                        <Input id="password" name="password" type="password" required />
                    </div>
                    <div className="space-y-2">
                        <SimpleLabel htmlFor="role">Role</SimpleLabel>
                        <select
                            id="role"
                            name="role"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        >
                            <option value="MEMBER">Member</option>
                            <option value="LEAD">Lead</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <SimpleLabel htmlFor="domain">Domain</SimpleLabel>
                        <select
                            id="domain"
                            name="domainId"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        >
                            <option value="">Select Domain</option>
                            {domains.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    {error && (
                        <div className="col-span-4 bg-error/10 text-error text-sm p-3 rounded-md border border-error/20">
                            {error}
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" isLoading={isLoading}>Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
