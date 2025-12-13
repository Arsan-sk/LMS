"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { User, Mail, Phone, Calendar, BookOpen, Save, Loader2, Lock, ShieldAlert } from "lucide-react"
import { useSession } from "next-auth/react"

interface UserProfile {
    id: string
    username: string
    email: string
    role: string
    phone: string | null
    year: string | null
    department: string | null
    bio: string | null
    profilePhoto: string | null
    domain: {
        name: string
    } | null
    createdAt: string
}

export default function ProfilePage() {
    const { data: session, update: updateSession } = useSession()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Separate loading states for different sections
    const [isSavingDetails, setIsSavingDetails] = useState(false)
    const [isSavingSecurity, setIsSavingSecurity] = useState(false)

    const [formData, setFormData] = useState({
        username: "",
        newPassword: "",
        currentPassword: "",
        phone: "",
        year: "",
        department: "",
        bio: "",
        profilePhoto: ""
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    async function fetchProfile() {
        try {
            const res = await fetch("/api/user/profile")
            const data = await res.json()
            setProfile(data)
            setFormData({
                username: data.username || "",
                newPassword: "",
                currentPassword: "",
                phone: data.phone || "",
                year: data.year || "",
                department: data.department || "",
                bio: data.bio || "",
                profilePhoto: data.profilePhoto || ""
            })
        } catch (error) {
            console.error("Failed to fetch profile", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDetailsUpdate(e: React.FormEvent) {
        e.preventDefault()
        setIsSavingDetails(true)

        try {
            // Only send non-sensitive fields
            const payload = {
                phone: formData.phone,
                year: formData.year,
                department: formData.department,
                bio: formData.bio,
                profilePhoto: formData.profilePhoto
            }

            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Failed to update profile details")
            }

            const updatedUser = await res.json()
            setProfile({ ...profile!, ...updatedUser })

            // Update session for profile photo
            if (payload.profilePhoto !== session?.user?.profilePhoto) {
                await updateSession({ user: { profilePhoto: payload.profilePhoto } })
            }

            alert("Profile details updated successfully!")
        } catch (error: any) {
            console.error("Update error:", error)
            alert(error.message)
        } finally {
            setIsSavingDetails(false)
        }
    }

    async function handleSecurityUpdate(e: React.FormEvent) {
        e.preventDefault()
        setIsSavingSecurity(true)

        try {
            // Only send sensitive fields
            const payload: any = {
                username: formData.username,
                currentPassword: formData.currentPassword
            }

            if (formData.newPassword) {
                payload.newPassword = formData.newPassword
            }

            // Remove username from payload if it hasn't changed to avoid unnecessary checks
            if (formData.username === profile?.username) {
                delete payload.username
            }

            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Failed to update security settings")
            }

            const updatedUser = await res.json()
            setProfile({ ...profile!, ...updatedUser })

            // Clear password fields
            setFormData(prev => ({
                ...prev,
                newPassword: "",
                currentPassword: ""
            }))

            alert("Security settings updated successfully!")
        } catch (error: any) {
            console.error("Update error:", error)
            alert(error.message)
        } finally {
            setIsSavingSecurity(false)
        }
    }

    if (isLoading) return <p>Loading profile...</p>
    if (!profile) return <p>Profile not found</p>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-graphite">My Profile</h1>
                <p className="text-secondary-500">Manage your account settings and preferences.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                {/* Left Column: ID Card */}
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                        <div className="h-32 w-32 rounded-full bg-secondary-100 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                            {formData.profilePhoto ? (
                                <img src={formData.profilePhoto} alt={profile.username} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-16 w-16 text-secondary-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-graphite">{profile.username}</h2>
                            <p className="text-sm text-secondary-500">{profile.email}</p>
                        </div>
                        <div className="w-full pt-4 border-t space-y-2 text-sm text-left">
                            <div className="flex justify-between">
                                <span className="text-secondary-500">Role</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${profile.role === 'ADMIN' ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600'}`}>
                                    {profile.role}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary-500">Domain</span>
                                <span className="font-medium text-neutral-graphite">{profile.domain?.name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary-500">Joined</span>
                                <span className="font-medium text-neutral-graphite">{new Date(profile.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Edit Forms */}
                <div className="space-y-6">
                    {/* 1. Personal Details Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Details</CardTitle>
                            <CardDescription>Update your public profile information.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleDetailsUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Profile Photo URL</label>
                                    <Input
                                        value={formData.profilePhoto}
                                        onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                                        placeholder="https://example.com/photo.jpg"
                                    />
                                    <p className="text-xs text-secondary-500">Enter a direct URL to an image.</p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-secondary-400" />
                                            <Input
                                                className="pl-9"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+1234567890"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Year / Batch</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-secondary-400" />
                                            <Input
                                                className="pl-9"
                                                value={formData.year}
                                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                                placeholder="e.g. 2025"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Department</label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-secondary-400" />
                                        <Input
                                            className="pl-9"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            placeholder="e.g. Computer Science"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Bio</label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Tell us a bit about yourself..."
                                    />
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button type="submit" disabled={isSavingDetails}>
                                        {isSavingDetails ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Details
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* 2. Account Security Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Security</CardTitle>
                            <CardDescription>Manage your username and password.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSecurityUpdate} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Username</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-secondary-400" />
                                            <Input
                                                className="pl-9"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                placeholder="Username"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-secondary-400" />
                                            <Input
                                                type="password"
                                                className="pl-9"
                                                value={formData.newPassword}
                                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                                placeholder="Min. 6 characters"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <ShieldAlert className="h-5 w-5 text-yellow-600 mt-0.5" />
                                        <div className="space-y-2 w-full">
                                            <label className="text-sm font-medium text-yellow-900">
                                                Current Password
                                            </label>
                                            <p className="text-xs text-yellow-700">
                                                Required only when changing username or password.
                                            </p>
                                            <Input
                                                type="password"
                                                value={formData.currentPassword}
                                                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                                placeholder="Enter current password to confirm changes"
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button type="submit" variant="danger" disabled={isSavingSecurity}>
                                        {isSavingSecurity ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="mr-2 h-4 w-4" />
                                                Update Security
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
